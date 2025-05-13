from flask import Flask, render_template, jsonify, request
import random

app = Flask(__name__)

# Todo: load from sample_texts.txt or build an endpoint to load from a database
SAMPLE_TEXTS = [
    "The quick brown fox jumps over the lazy dog.",
    "Python is a versatile and powerful programming language.",
    "Flask is a micro web framework written in Python.",
    "Practice makes perfect when it comes to typing speed.",
    "The journey of a thousand miles begins with a single step.",
    "Coding is like solving a puzzle, challenging yet rewarding.",
    "To be or not to be, that is the question.",
    "All that glitters is not gold.",
    "A penny saved is a penny earned.",
    "Keep your friends close and your enemies closer."
]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_text')
def get_text():
    return jsonify({'text': random.choice(SAMPLE_TEXTS)})

@app.route('/submit_results', methods=['POST'])
def submit_results():
    data = request.get_json()
    original_text = data.get('original_text', '')
    typed_text = data.get('typed_text', '')
    time_taken_ms = data.get('time_taken_ms', 0)

    if not original_text or time_taken_ms == 0:
        return jsonify({'error': 'Invalid data'}), 400

    original_words = original_text.split()
    typed_words_list = typed_text.split()
    
    correct_words_count = 0
    # Only compare up to the number of words the user actually typed or the original had
    for i in range(min(len(original_words), len(typed_words_list))):
        if original_words[i] == typed_words_list[i]:
            correct_words_count += 1

    time_taken_seconds = time_taken_ms / 1000.0
    time_taken_minutes = time_taken_seconds / 60.0
    
    wpm = 0
    if time_taken_minutes > 0:
        wpm = round(correct_words_count / time_taken_minutes)
    else:
        wpm = 0 # Avoid division by zero if time is extremely short or zero

    # --- Calculate Accuracy ---
    correct_characters = 0
    
    len_typed = len(typed_text)
    len_original_to_compare = min(len(typed_text), len(original_text))

    for i in range(len_original_to_compare):
        if typed_text[i] == original_text[i]:
            correct_characters += 1
    
    accuracy = 0
    if len_typed > 0:
        temp_correct_chars = 0
        for i in range(min(len(typed_text), len(original_text))):
            if typed_text[i] == original_text[i]:
                temp_correct_chars +=1
        accuracy = round((temp_correct_chars / len_typed) * 100) if len_typed > 0 else 0
    else:
        accuracy = 0


    return jsonify({
        'wpm': wpm,
        'accuracy': accuracy,
        'correct_words': correct_words_count,
        'typed_words': len(typed_words_list),
        'time_seconds': round(time_taken_seconds, 2)
    })

if __name__ == '__main__':
    app.run(debug=True)
