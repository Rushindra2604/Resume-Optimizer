const TEST_MODE = false;

// 🔥 MAIN FUNCTION
async function analyze() {

    // Start loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('analyzeBtn').disabled = true;
    document.getElementById('errorMsg').textContent = "";

    // TEST MODE
    if (TEST_MODE) {
        const data = {
            match_score: 67,
            score_reason: "Missing React and API experience",
            matched_keywords: ["HTML", "CSS", "JavaScript"],
            missing_keywords: ["React.js", "REST APIs"],
            suggestions: [
                "Add React.js experience",
                "Improve API knowledge"
            ],
            improved_bullets: [
                "Developed a resume builder using JavaScript and AI APIs",
                "Improved UI/UX for better user interaction"
            ]
        };

        renderResult(data);
        stopLoading();
        return;
    }

    // Get inputs
    const resumeText = document.getElementById('resume').value;
    const jobDesc = document.getElementById('jobDesc').value;
    const fileInput = document.getElementById('resumeFile');

    // Validation
    if (!jobDesc) {
        document.getElementById('errorMsg').textContent = "Please enter job description.";
        stopLoading();
        return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("jobDescription", jobDesc);
    formData.append("resumeText", resumeText);

    if (fileInput.files.length > 0) {
        formData.append("file", fileInput.files[0]);
    }

    try {
        const response = await fetch('/analyze', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.error) {
            document.getElementById('errorMsg').textContent = data.error;
            stopLoading();
            return;
        }

        renderResult(data);

    } catch (err) {
        console.error(err);
        document.getElementById('errorMsg').textContent =
            "Unable to analyze. Please try again.";
    }

    stopLoading();
}


// 🔥 UI RENDER FUNCTION
function renderResult(data) {
    const score = data.match_score || 0;
    const reason = data.score_reason || "";
    const matched = data.matched_keywords || [];
    const missing = data.missing_keywords || [];
    const suggestions = data.suggestions || [];
    const bullets = data.improved_bullets || [];

    // Score
    document.getElementById('scoreBar').style.width = score + "%";
    document.getElementById('scoreText').textContent = score + "% match";
    document.getElementById('scoreReason').textContent = reason;

    // Matched keywords
    const matchedDiv = document.getElementById('matchedKeywords');
    matchedDiv.innerHTML = "";
    matched.forEach(k => {
        const span = createTag(k, "green");
        matchedDiv.appendChild(span);
    });

    // Missing keywords
    const keywordDiv = document.getElementById('keywords');
    keywordDiv.innerHTML = "";
    missing.forEach(k => {
        const span = createTag(k, "red");
        keywordDiv.appendChild(span);
    });

    // Suggestions
    const suggestionList = document.getElementById('suggestions');
    suggestionList.innerHTML = "";
    suggestions.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        suggestionList.appendChild(li);
    });

    // Improved bullets
    const bulletList = document.getElementById('improvedBullets');
    bulletList.innerHTML = "";

    bullets.forEach(b => {
        const li = document.createElement('li');
        li.textContent = b.replace(/\*\*/g, "");

        const btn = document.createElement('button');
        btn.textContent = "Copy";
        btn.style.marginLeft = "10px";

        btn.onclick = () => {
            navigator.clipboard.writeText(b);
            btn.textContent = "Copied!";
            setTimeout(() => {
                btn.textContent = "Copy";
            }, 1500);
        };

        li.appendChild(btn);
        bulletList.appendChild(li);
    });

    const resumeText = data.resume_text || "";
    const matchedWords = data.matched_keywords || [];
    const missingWords = data.missing_keywords || [];

    let highlighted = resumeText;

    // Highlight matched (green)
    matchedWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        highlighted = highlighted.replace(regex, (match) =>
             `<span style="background:#22c55e; color:white; padding:2px 4px; border-radius:4px;">${match}</span>`
        );
    });

    // Highlight missing (red)
    missingWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        highlighted = highlighted.replace(regex, (match) => 
            `<span style="background:#ef4444; color:white; padding:2px 4px; border-radius:4px;">${match}</span>`
        );
    });

    // Show in UI
    document.getElementById('highlightedResume').innerHTML = highlighted;
}


// 🔥 HELPER: CREATE TAG
function createTag(text, color) {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.padding = "5px";
    span.style.margin = "5px";
    span.style.background = color;
    span.style.color = "white";
    span.style.display = "inline-block";
    span.style.borderRadius = "5px";
    return span;
}


// 🔥 STOP LOADING
function stopLoading() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('analyzeBtn').disabled = false;
}


// 🔥 CLEAR FUNCTION
function clearAll() {
    document.getElementById('resume').value = "";
    document.getElementById('jobDesc').value = "";
    document.getElementById('scoreBar').style.width = "0%";
    document.getElementById('scoreText').textContent = "";
    document.getElementById('scoreReason').textContent = "";
    document.getElementById('matchedKeywords').innerHTML = "";
    document.getElementById('keywords').innerHTML = "";
    document.getElementById('suggestions').innerHTML = "";
    document.getElementById('improvedBullets').innerHTML = "";
    document.getElementById('errorMsg').textContent = "";
}