import cv2
import pyrealsense2 as rs
import numpy as np
import matplotlib.pyplot as plt
import tkinter as tk
from PIL import Image, ImageTk

# Threshold for SAFE distance (in m)
depth_thresh = 0.0001
distance_range = 0.005
seed_point = (320, 240)

# Create a pipeline
pipeline = rs.pipeline()
config = rs.config()
config.enable_stream(rs.stream.depth, 640, 480, rs.format.z16, 30)
config.enable_stream(rs.stream.color, 640, 480, rs.format.bgr8, 30)

# Start streaming
pipeline.start(config)

# Create a Tkinter window
window = tk.Tk()
window.title("Depth Detection")
window.geometry("1280x480")

# Create a canvas to display the output image
canvas = tk.Canvas(window, width=1280, height=480)
canvas.pack()


def region_growing(depth_frame, seed_point, depth_threshold, distance_range):
    # Convert depth_frame to a 2D array
    depth_image = np.asanyarray(depth_frame.get_data())

    # Create a mask to store the region growing result
    mask = np.zeros_like(depth_image, dtype=np.uint8)

    # Create a mask to keep track of visited pixels
    visited = np.zeros_like(depth_image, dtype=bool)

    # Get the seed point coordinates
    seed_x, seed_y = seed_point
    seed_depth = depth_frame.get_distance(seed_x, seed_y)

    # Initialize a queue for the region growing process
    queue_output = [(seed_x, seed_y)]

    # Perform region growing
    while len(queue_output) > 0:
        x, y = queue_output.pop(0)

        # Check if the current pixel has already been visited
        if visited[y, x]:
            continue

        # Check if the current pixel is within the depth range
        if abs(depth_frame.get_distance(x, y) - seed_depth) <= depth_threshold and abs(depth_frame.get_distance(x, y) - seed_depth) <= distance_range:
            # Add the pixel to the region mask
            mask[y, x] = 255
            visited[y, x] = True

            # Add neighboring pixels to the queue
            if x > 0:
                queue_output.append((x - 1, y))
            if x < depth_frame.width - 1:
                queue_output.append((x + 1, y))
            if y > 0:
                queue_output.append((x, y - 1))
            if y < depth_frame.height - 1:
                queue_output.append((x, y + 1))

    return mask


def update_image():
    while True:
        # Wait for a coherent pair of frames: depth and color
        frames = pipeline.wait_for_frames()
        depth_frame = frames.get_depth_frame()
        color_frame = frames.get_color_frame()
        if not depth_frame or not color_frame:
            continue

        # Convert images to numpy arrays
        depth_image = np.asanyarray(depth_frame.get_data())
        color_image = np.asanyarray(color_frame.get_data())
        # Apply colormap on depth image (image must be converted to 8-bit per pixel first)
        depth_colormap = cv2.applyColorMap(cv2.convertScaleAbs(depth_image, alpha=0.1), cv2.COLORMAP_JET)

        # Create output canvas
        output_canvas = np.zeros((480, 1280, 3), dtype=np.uint8)
        output_canvas[:, 0:640, :] = depth_colormap
        # Apply region growing
        kernel = np.ones((5, 5), np.uint16)
        mask = region_growing(depth_frame, seed_point, depth_thresh, distance_range)
        # Apply morphological operations to refine the mask
        mask = cv2.dilate(mask, kernel, iterations=2)
        mask = cv2.erode(mask, kernel, iterations=1)
        refined_mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        refined_mask_rgb = cv2.cvtColor(refined_mask, cv2.COLOR_GRAY2BGR)
        output_canvas[:, 640:, :] = refined_mask_rgb
        # Convert the output canvas to an ImageTk format
        img = Image.fromarray(output_canvas)
        imgtk = ImageTk.PhotoImage(image=img)

        # Update the canvas with the new image
        canvas.create_image(0, 0, anchor=tk.NW, image=imgtk)
        canvas.image = imgtk

        # Convert the predicted mask to binary
        threshold = 0.5  # Adjust this threshold if necessary
        binary_mask = (refined_mask > threshold).astype(np.uint8)

        # Find the coordinates of the white pixels in the binary mask
        white_pixels = np.where(binary_mask == 1)

        if len(white_pixels[0]) > 0:
            # Calculate the height and width of amputation
            topmost_pixel = np.min(white_pixels[0])
            bottommost_pixel = np.max(white_pixels[0])
            leftmost_pixel = np.min(white_pixels[1])
            rightmost_pixel = np.max(white_pixels[1])

            height = bottommost_pixel - topmost_pixel
            width = rightmost_pixel - leftmost_pixel

            # Calculate the center coordinates as the average of white pixel coordinates
            center_pixel = np.mean(white_pixels, axis=1, dtype=int)

            # Choose the web pixel based on your criteria (e.g., topmost pixel)
            web_pixel = (white_pixels[0][np.argmin(white_pixels[0])], white_pixels[1][np.argmin(white_pixels[0])])

            # Print the coordinates of the central and web pixels
            print("Central Pixel Coordinates:", center_pixel)
            print("Web Pixel Coordinates:", web_pixel)

            central_depth = depth_frame.get_distance(center_pixel[1], center_pixel[0])

            # Assuming you have the web pixel coordinates as `web_pixel`
            web_depth = depth_frame.get_distance(web_pixel[1], web_pixel[0])

            # Calculate the depth difference
            depth_difference = abs(central_depth - web_depth)

            # Print the depth difference
            print("Depth Difference:", depth_difference)

            # Print the measured height and width
            print("Height pixels:", height)
            print("Width pixels:", width)

        # Update the Tkinter window
        window.update()


update_image()
# Start the Tkinter event loop
window.mainloop()

# Stop streaming
pipeline.stop()
