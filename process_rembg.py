from rembg import remove
from PIL import Image

def remove_bg(input_path, output_path):
    print(f"Processing {input_path}...")
    try:
        input_image = Image.open(input_path)
        output_image = remove(input_image)
        output_image.save(output_path)
        print(f"Saved {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

if __name__ == "__main__":
    remove_bg("public/images/tool_brush_v3.png", "public/images/tool_brush_v4.png")
    remove_bg("public/images/tool_comb_v3.png", "public/images/tool_comb_v4.png")
    remove_bg("public/images/tool_scissors_v3.png", "public/images/tool_scissors_v4.png")
    remove_bg("public/images/tool_blowdryer_v3.png", "public/images/tool_blowdryer_v4.png")
