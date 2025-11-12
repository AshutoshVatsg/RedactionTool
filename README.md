🤖 Redaction Tool 🤖This is a full-stack document redaction tool built in 2 days. It uses a Python backend (with AI and OCR) to find and redact sensitive information from documents and a React frontend to provide a user interface.Project StructureThis project is a "monorepo" containing two separate applications:/backend: The Python Flask API that handles all the heavy lifting./frontend: The React (Vite) web application that the user interacts with.FeaturesFile Conversion: Converts any PDF, DOCX, TXT, or Image into a standard format.AI-Powered OCR: Uses EasyOCR to extract text and coordinates from any document.Hybrid AI "Brain":AI (spaCy): Uses a Transformer model (en_core_web_trf) to find contextual entities (PERSON, ADDRESS).Regex (Python): Uses context-aware Regex to find patterns (PHONE, EMAIL, NRIC/FIN, DATE, etc.).Image Redaction: Redacts the original image by drawing <LABEL> tags over sensitive data.API: A Flask API bridges the backend engine and the frontend.Frontend: A React app with a drag-and-drop UI for file upload and category selection.How to Run This ProjectYou must run both the backend and frontend servers in two separate terminals.1. Run the Backend (Python API)# 1. Go to the backend folder
cd RedactionTool

# 2. Activate your virtual environment
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the API server
python3 api.py
Your backend will now be running at http://127.0.0.1:50002. Run the Frontend (React App)# 1. Open a NEW terminal and go to the frontend folder
cd frontend-app

# 2. Install dependencies
npm install

# 3. Run the development server
npm run dev
Your frontend will now be running at http://localhost:5173You can now open http://localhost:5173 in your browser to use the app.