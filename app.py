import os
from flask import Flask, render_template, jsonify, session, request
import random
from datetime import datetime
from database import db
from models import SpinResult, Statistics

app = Flask(__name__, static_folder='static', static_url_path='/static')
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Configure SQLAlchemy
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize extensions
db.init_app(app)

# Initialize database
with app.app_context():
    try:
        # Create all tables
        db.create_all()

        # Initialize statistics if needed
        if not Statistics.query.first():
            initial_stats = Statistics()
            db.session.add(initial_stats)
            db.session.commit()
            print("Database initialized successfully")
    except Exception as e:
        print(f"Database initialization error: {e}")

@app.route('/')
def index():
    if 'credits' not in session:
        session['credits'] = 1000
    if 'bonus_spins' not in session:
        session['bonus_spins'] = 0
    return render_template('index.html', credits=session['credits'])

@app.route('/spin', methods=['POST'])
def spin():
    if 'credits' not in session:
        return jsonify({'error': 'Session expired'}), 400

    try:
        bet = float(request.form.get('bet', 0.20))
        if bet < 0.20 or bet > 100:
            return jsonify({'error': 'Invalid bet amount'}), 400
        if session['credits'] < bet:
            return jsonify({'error': 'Insufficient credits'}), 400

        # Deduct bet
        session['credits'] = session['credits'] - bet

        # Generate result
        symbols = ['10', 'J', 'Q', 'K', 'A', 'zmeja', 'gorilla', 'jaguar', 'crocodile', 'lenivec', 'scatter']
        result = [[random.choice(symbols) for _ in range(3)] for _ in range(5)]

        # Calculate winnings (simplified for now)
        winnings = bet * random.uniform(0, 2)  # Random win between 0x and 2x bet
        session['credits'] = session['credits'] + winnings

        # Update statistics
        stats = Statistics.query.first()
        if stats:
            stats.total_spins += 1
            if winnings > 0:
                stats.total_wins += 1
                stats.biggest_win = max(stats.biggest_win, winnings)
            stats.total_bet += bet
            stats.total_won += winnings
            db.session.commit()

        # Record spin result
        spin_result = SpinResult(
            bet_amount=bet,
            win_amount=winnings,
            result_matrix=str(result),
            timestamp=datetime.utcnow()
        )
        db.session.add(spin_result)
        db.session.commit()

        return jsonify({
            'result': result,
            'winnings': winnings,
            'credits': session['credits']
        })

    except Exception as e:
        print(f"Error during spin: {str(e)}")
        return jsonify({'error': 'An error occurred during spin'}), 400

@app.route('/statistics')
def get_statistics():
    stats = Statistics.query.first()
    if not stats:
        stats = Statistics()
        db.session.add(stats)
        db.session.commit()

    return jsonify({
        'total_spins': stats.total_spins,
        'total_wins': stats.total_wins,
        'win_rate': round((stats.total_wins / stats.total_spins * 100) if stats.total_spins > 0 else 0, 2),
        'biggest_win': stats.biggest_win,
        'total_bet': stats.total_bet,
        'total_won': stats.total_won,
        'rtp': round((stats.total_won / stats.total_bet * 100) if stats.total_bet > 0 else 0, 2),
        'total_bonus_games': stats.total_bonus_games
    })

@app.route('/buy_freespins', methods=['POST'])
def buy_freespins():
    if 'credits' not in session:
        return jsonify({'error': 'Session expired'}), 400

    try:
        bet = float(request.form.get('bet', 0.20))
        cost = bet * 10

        if session['credits'] < cost:
            return jsonify({'error': 'Insufficient credits'}), 400

        # Deduct the cost
        session['credits'] = session['credits'] - cost

        # Award 10 free spins
        bonus_spins = 10
        session['bonus_spins'] = session.get('bonus_spins', 0) + bonus_spins

        # Update statistics
        stats = Statistics.query.first()
        if stats:
            stats.total_bonus_games += 1
            stats.total_bet += cost
            db.session.commit()

        return jsonify({
            'credits': session['credits'],
            'bonus_spins_awarded': bonus_spins,
            'bonus_spins_remaining': session['bonus_spins']
        })

    except Exception as e:
        print(f"Error buying free spins: {str(e)}")
        return jsonify({'error': 'An error occurred while buying free spins'}), 400

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)