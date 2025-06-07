from flask import Flask, render_template, request, jsonify
import requests
from functools import wraps
import time
from typing import Dict, Any, Optional

app = Flask(__name__)

# Rate limiting configuration
RATE_LIMIT = 5  # requests per minute
rate_limit_store: Dict[str, list] = {}

def rate_limit(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        ip = request.remote_addr
        current_time = time.time()
        
        if ip not in rate_limit_store:
            rate_limit_store[ip] = []
        
        # Remove old timestamps
        rate_limit_store[ip] = [t for t in rate_limit_store[ip] if current_time - t < 60]
        
        if len(rate_limit_store[ip]) >= RATE_LIMIT:
            return jsonify({
                'success': False,
                'error': 'Rate limit exceeded. Please wait before sending more messages.'
            }), 429
        
        rate_limit_store[ip].append(current_time)
        return f(*args, **kwargs)
    return decorated_function

def validate_webhook_url(url: str) -> bool:
    """Validate if the URL is a valid Discord webhook URL."""
    return url.startswith('https://discord.com/api/webhooks/') or url.startswith('https://canary.discord.com/api/webhooks/')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/send_webhook', methods=['POST'])
@rate_limit
def send_webhook():
    try:
        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'Nenhum dado fornecido'}), 400

        webhook_url = data.get('webhook_url')
        content = data.get('content')
        embeds = data.get('embeds', [])

        if not webhook_url:
            return jsonify({'success': False, 'error': 'URL do webhook não fornecida'}), 400

        if not validate_webhook_url(webhook_url):
            return jsonify({'success': False, 'error': 'URL do webhook inválida'}), 400

        if not content and not embeds:
            return jsonify({'success': False, 'error': 'Mensagem ou embeds são obrigatórios'}), 400

        payload = {}
        if content:
            payload["content"] = content
        if embeds:
            payload["embeds"] = embeds

        response = requests.post(webhook_url, json=payload, timeout=5)
        
        if response.status_code == 204:
            return jsonify({'success': True})
        else:
            error_message = f'Erro Discord: {response.status_code}'
            try:
                error_data = response.json()
                if 'message' in error_data:
                    error_message += f' - {error_data["message"]}'
            except:
                pass
            return jsonify({'success': False, 'error': error_message}), 500
            
    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'Timeout ao enviar mensagem'}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({'success': False, 'error': f'Erro de conexão: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erro interno: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(debug=True)