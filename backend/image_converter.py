# -----------------------------------------------------------------
# image_converter.py (v3)
#
# This version is now "dumb" again. It ONLY converts a
# file into a standard PNG image. It no longer does
# any pre-processing.
# -----------------------------------------------------------------

import fitz  # PyMuPDF
import docx
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO

# --- 1. PDF & IMAGE Handler ---

def convert_pdf_or_image_to_bytes(file_bytes, file_type):
    """
    Handles PDFs and standard images.
    - For PDFs: Converts the FIRST page to a high-DPI PNG.
    - For Images: Opens and re-saves as PNG for consistency.
    """
    if file_type == "pdf":
        try:
            pdf_document = fitz.open(stream=file_bytes, filetype="pdf")
            page = pdf_document.load_page(0)
            pix = page.get_pixmap(dpi=200) 
            image_bytes = pix.tobytes("png")
            pdf_document.close()
            return image_bytes
        except Exception as e:
            print(f"Error converting PDF: {e}")
            return None
            
    elif file_type in ["png", "jpg", "jpeg"]:
        # It's already an image. Open and re-save as PNG
        # to standardize the format for our next steps.
        try:
            img = Image.open(BytesIO(file_bytes))
            output_stream = BytesIO()
            img.save(output_stream, format="PNG")
            return output_stream.getvalue()
        except Exception as e:
            print(f"Error standardizing image: {e}")
            return None

# --- 2. DOCX & TXT Handler ---

def convert_text_to_image_bytes(file_bytes, file_type):
    """
    "Rasterizes" a text-based file. This already creates
    a perfect black-on-white image.
    """
    text = ""
    file_stream = BytesIO(file_bytes)
    
    try:
        if file_type == "docx":
            doc = docx.Document(file_stream)
            all_paras = [para.text for para in doc.paragraphs]
            text = "\n".join(all_paras)
        
        elif file_type == "txt":
            text = file_stream.read().decode("utf-8")
    
    except Exception as e:
        print(f"Error reading {file_type}: {e}")
        return None

    padding = 50
    img_width = 1200
    bg_color = "white"
    font_color = "black"
    
    try:
        font = ImageFont.load_default(size=24)
    except IOError:
        font = ImageFont.load_default()

    temp_img = Image.new("RGB", (1, 1))
    temp_draw = ImageDraw.Draw(temp_img)
    
    if hasattr(temp_draw, 'textbbox'):
        bbox = temp_draw.textbbox((padding, padding), text, font=font)
        text_height = bbox[3]
    else:
        text_width, text_height = temp_draw.textsize(text, font=font)

    img_height = text_height + (padding * 2) 

    image = Image.new("RGB", (img_width, img_height), color=bg_color)
    draw = ImageDraw.Draw(image)

    draw.text(
        (padding, padding),
        text,
        fill=font_color,
        font=font
    )
    
    output_stream = BytesIO()
    image.save(output_stream, format="PNG")
    return output_stream.getvalue()

# --- 3. THE MAIN "HANDLER" FUNCTION ---

def convert_to_image(uploaded_file):
    """
    This is the main function your app will call.
    It takes the uploaded file and returns its first page as 
    a standard PNG, ready for the engine.
    """
    if uploaded_file is None:
        return None
        
    file_bytes = uploaded_file.getvalue()
    file_type = uploaded_file.name.split('.')[-1].lower()
    
    if file_type in ["pdf", "png", "jpg", "jpeg"]:
        return convert_pdf_or_image_to_bytes(file_bytes, file_type)
    
    elif file_type in ["docx", "txt"]:
        return convert_text_to_image_bytes(file_bytes, file_type)
        
    else:
        print(f"Unsupported file type: {file_type}")
        return None