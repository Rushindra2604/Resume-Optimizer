from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import json
import re
import pdfplumber
import os

# 🔐 Configure API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = Flask(__name__)

# 🏠 Home Route
@app.route('/')
def home():
    return render_template('index.html')


STOPWORDS = {"the", "is", "and", "or", "of", "a", "to", "in", "for", "with", "on", "at", "by"}

def extract_keywords(text):
    words = re.findall(r'\b\w+\b', text.lower())
    return set([w for w in words if w not in STOPWORDS and len(w) > 2])


# 🚀 Analyze Route (MAIN LOGIC)
@app.route('/analyze', methods=['POST'])
def analyze():

    job_desc = request.form.get('jobDescription')
    resume_text = request.form.get('resumeText')
    file = request.files.get('file')

    text = ""

    # 📄 Step 1: Extract resume text
    if file:
        with pdfplumber.open(file) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""

        if not text.strip():
            return jsonify({
                "error": "Could not extract text from PDF. Please paste resume manually."
            })
    else:
        text = resume_text

    if not text or not job_desc:
        return jsonify({
            "error": "Please provide both resume and job description."
        })

    # 🧠 Step 2: Hybrid Logic (Keyword Matching)
    resume_words = extract_keywords(text)
    job_words = extract_keywords(job_desc)

    matched = list(resume_words & job_words)
    missing = list(job_words - resume_words)

    if len(job_words) == 0:
        score = 0
    else:
        score = int((len(matched) / len(job_words)) * 100)

        # Clamp score realistically
        if score > 85:
            score = min(score, 90)


    # 🤖 Step 3: AI Prompt (ONLY for enhancement)
    prompt = f"""
    You are an ATS expert.

    The system already calculated:

    Match Score: {score}
    Matched Keywords: {matched[:20]}
    Missing Keywords: {missing[:20]}

    Now provide:

    - score_reason
    - suggestions
    - improved_bullets

    Return ONLY JSON:

    {{
      "score_reason": "",
      "suggestions": [],
      "improved_bullets": []
    }}
    """

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)

        cleaned = response.text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(cleaned)

        # 🔥 Step 4: Merge Hybrid + AI Output
        parsed["match_score"] = score
        parsed["matched_keywords"] = matched[:20]
        parsed["missing_keywords"] = missing[:20]
        parsed["resume_text"] = text

        return jsonify(parsed)

    except Exception as e:
        return jsonify({
            "error": str(e)
        })


# ▶️ Run App
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)