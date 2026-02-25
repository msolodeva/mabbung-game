from PIL import Image, ImageDraw, ImageOps
import sys


def crop_face(input_path, output_path):
    try:
        # Load image and apply EXIF orientation to fix rotation issues
        img = Image.open(input_path)
        img = ImageOps.exif_transpose(img)
        img = img.convert("RGBA")

        width, height = img.size

        # Assume face is located in the upper center.
        size = int(min(width, height) * 0.6)  # The face takes up some part of the image
        left = (width - size) // 2
        top = int(height * 0.15)  # A bit from the top
        if top + size > height:
            top = height - size

        box = (left, top, left + size, top + size)
        face_img = img.crop(box)

        # Create circular mask
        mask = Image.new("L", (size, size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, size, size), fill=255)

        # Apply mask
        result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        result.paste(face_img, (0, 0), mask)

        # Resize to a bit larger than character radius 22 (so 44x44), maybe 64x64 for high res
        result = result.resize((64, 64), Image.Resampling.LANCZOS)

        result.save(output_path, "PNG")
        print(f"Successfully saved {output_path}")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    crop_face(sys.argv[1], sys.argv[2])
