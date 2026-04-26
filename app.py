from flask import Flask, request, jsonify, send_from_directory, session
import sqlite3
import os

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = 'super_secret_gearup_key'  # Needed for session management if needed, but we can use simple API with user_id passed in JSON

def get_db_connection():
    conn = sqlite3.connect('database.db')
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price TEXT NOT NULL,
            image_url TEXT NOT NULL,
            category TEXT NOT NULL
        )
    ''')
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user'
        )
    ''')
    
    # Cart table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cart (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            price TEXT NOT NULL,
            image_url TEXT NOT NULL,
            quantity INTEGER DEFAULT 1,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')

    # Wishlist table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS wishlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            price TEXT NOT NULL,
            image_url TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    ''')
    
    # Insert admin user if not exists
    cursor.execute('SELECT COUNT(*) FROM users WHERE email = ?', ('admin@gearup.com',))
    if cursor.fetchone()[0] == 0:
        cursor.execute('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                       ('Admin', 'admin@gearup.com', 'admin123', 'admin'))
        
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/admin')
def serve_admin():
    return send_from_directory('.', 'admin.html')

# --- USER API ---
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not all([name, email, password]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', (name, email, password))
        conn.commit()
        return jsonify({'success': True, 'message': 'Signup successful'})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already registered'}), 409
    finally:
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    conn = get_db_connection()
    user = conn.execute('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?', (email, password)).fetchone()
    conn.close()
    
    if user:
        user_dict = dict(user)
        session['user_id'] = user_dict['id']
        session['user_role'] = user_dict['role']
        session['user_name'] = user_dict['name']
        session['user_email'] = user_dict['email']
        return jsonify({'success': True, 'user': user_dict})
    else:
        return jsonify({'error': 'Invalid email or password'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out successfully'})

@app.route('/api/session', methods=['GET'])
def get_session():
    if 'user_id' in session:
        return jsonify({
            'user': {
                'id': session['user_id'],
                'role': session.get('user_role'),
                'name': session.get('user_name'),
                'email': session.get('user_email')
            }
        })
    else:
        return jsonify({'user': None})

# --- PRODUCTS API ---
@app.route('/api/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    products = conn.execute('SELECT * FROM products').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in products])

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.json
    name = data.get('name')
    price = data.get('price')
    image_url = data.get('image_url')
    category = data.get('category', 'General')
    
    if not all([name, price, image_url]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO products (name, price, image_url, category) VALUES (?, ?, ?, ?)',
                   (name, price, image_url, category))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    
    return jsonify({'id': new_id, 'name': name, 'price': price, 'image_url': image_url, 'category': category}), 201

@app.route('/api/products/<int:id>', methods=['DELETE'])
def delete_product(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM products WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# --- CART API ---
@app.route('/api/cart', methods=['GET'])
def get_cart():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
        
    conn = get_db_connection()
    cart_items = conn.execute('SELECT * FROM cart WHERE user_id = ?', (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in cart_items])

@app.route('/api/cart', methods=['POST'])
def add_to_cart():
    data = request.json
    user_id = data.get('user_id')
    name = data.get('name')
    price = data.get('price')
    image_url = data.get('image_url')
    
    if not all([user_id, name, price, image_url]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if item exists in cart
    existing = cursor.execute('SELECT id, quantity FROM cart WHERE user_id = ? AND name = ?', (user_id, name)).fetchone()
    if existing:
        cursor.execute('UPDATE cart SET quantity = quantity + 1 WHERE id = ?', (existing['id'],))
    else:
        cursor.execute('INSERT INTO cart (user_id, name, price, image_url, quantity) VALUES (?, ?, ?, ?, 1)',
                       (user_id, name, price, image_url))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/cart/<int:id>', methods=['PUT'])
def update_cart_qty(id):
    data = request.json
    quantity = data.get('quantity')
    
    conn = get_db_connection()
    if quantity <= 0:
        conn.execute('DELETE FROM cart WHERE id = ?', (id,))
    else:
        conn.execute('UPDATE cart SET quantity = ? WHERE id = ?', (quantity, id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/cart/clear', methods=['POST'])
def clear_cart():
    data = request.json
    user_id = data.get('user_id')
    conn = get_db_connection()
    conn.execute('DELETE FROM cart WHERE user_id = ?', (user_id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# --- WISHLIST API ---
@app.route('/api/wishlist', methods=['GET'])
def get_wishlist():
    user_id = request.args.get('user_id')
    if not user_id:
        return jsonify({'error': 'Missing user_id'}), 400
        
    conn = get_db_connection()
    items = conn.execute('SELECT * FROM wishlist WHERE user_id = ?', (user_id,)).fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in items])

@app.route('/api/wishlist', methods=['POST'])
def add_to_wishlist():
    data = request.json
    user_id = data.get('user_id')
    name = data.get('name')
    price = data.get('price')
    image_url = data.get('image_url')
    
    if not all([user_id, name, price, image_url]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    # Ensure no duplicates
    existing = cursor.execute('SELECT id FROM wishlist WHERE user_id = ? AND name = ?', (user_id, name)).fetchone()
    if not existing:
        cursor.execute('INSERT INTO wishlist (user_id, name, price, image_url) VALUES (?, ?, ?, ?)',
                       (user_id, name, price, image_url))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@app.route('/api/wishlist/<int:id>', methods=['DELETE'])
def remove_from_wishlist(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM wishlist WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

# --- SUBSCRIBE API (EMAIL) ---
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

@app.route('/api/subscribe', methods=['POST'])
def subscribe():
    data = request.json
    user_email = data.get('email')
    
    if not user_email:
        return jsonify({'error': 'Missing email'}), 400
        
    # Set your email credentials here
    SENDER_EMAIL = "thirumalait180@gmail.com" 
    SENDER_APP_PASSWORD = "yygb cpwz buvi jltk"
    
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = user_email
    msg['Subject'] = "Welcome to Sports Gearup Premium!"
    
    body = """
    Hello!
    
    Thank you for subscribing to the Sports Gearup Store newsletter! 
    You are now on the list to receive our exclusive deals, new product alerts, and special discounts.
    
    Get ready to gear up and game on!
    
    Best regards,
    The Sports Gearup Team
    """
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        # Note: To actually send the email, you must replace the SENDER_EMAIL and 
        # SENDER_APP_PASSWORD above with your real Gmail address and a generated App Password.
        # Once you do, uncomment the 4 lines below:
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_APP_PASSWORD)
        server.send_message(msg)
        server.quit()
        
        print(f"\n[EMAIL SIMULATION] Sent to: {user_email}\n{body}\n")
        return jsonify({'success': True, 'message': 'Subscribed and email sent!'})
    except Exception as e:
        print("Email sending failed:", e)
        return jsonify({'error': 'Failed to send email. Check credentials.'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
