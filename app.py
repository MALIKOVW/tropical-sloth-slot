import os
from flask import Flask, render_template, jsonify, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///slots.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

db.init_app(app)

@app.route('/')
def index():
    if 'credits' not in session:
        session['credits'] = 1000  # Starting credits
    return render_template('index.html', credits=session['credits'])

@app.route('/spin', methods=['POST'])
def spin():
    import random
    
    symbols = ['dog', 'house', 'bone', 'collar', 'paw']
    bet = int(request.form.get('bet', 10))
    
    if session['credits'] < bet:
        return jsonify({'error': 'Insufficient credits'})
    
    # Deduct bet
    session['credits'] -= bet
    
    # Generate result
    result = [
        [random.choice(symbols) for _ in range(5)],
        [random.choice(symbols) for _ in range(5)],
        [random.choice(symbols) for _ in range(5)]
    ]
    
    # Calculate winnings
    winnings = calculate_winnings(result, bet)
    session['credits'] += winnings
    
    return jsonify({
        'result': result,
        'winnings': winnings,
        'credits': session['credits']
    })

def calculate_winnings(result, bet):
    # Simple winning logic - matches on middle row
    middle_row = result[1]
    matches = 1
    symbol = middle_row[0]
    
    for i in range(1, len(middle_row)):
        if middle_row[i] == symbol:
            matches += 1
        else:
            break
    
    if matches >= 3:
        return bet * (matches * 2)
    return 0

with app.app_context():
    db.create_all()
