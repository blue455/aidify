document.addEventListener('DOMContentLoaded', function() {
    const mtnCard = document.getElementById('mtn-card');
    const orangeCard = document.getElementById('orange-card');
    const formSection = document.getElementById('payment-form-section');

    function renderForm(provider) {
        formSection.innerHTML = `
            <form id="pay-form" class="pay-form">
                <h2>Pay with ${provider === 'mtn' ? 'MTN Mobile Money' : 'Orange Money'}</h2>
                <input type="text" name="phone" placeholder="Phone Number" required pattern="[0-9]{9,13}"><br>
                <input type="number" name="amount" placeholder="Amount" required min="100"><br>
                <button type="submit">Pay Now</button>
            </form>
            <div id="pay-result"></div>
        `;
        document.getElementById('pay-form').onsubmit = async function(e) {
            e.preventDefault();
            const phone = this.phone.value.trim();
            const amount = parseInt(this.amount.value, 10);
            await payWithAPI(provider, phone, amount);
        };
    }

    async function payWithAPI(provider, phone, amount) {
        const endpoint = '/api/pay/collect';
        const resultEl = document.getElementById('pay-result');
        resultEl.textContent = 'Processing payment...';
        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, phone, amount })
            });

            const raw = await res.text();
            let data;
            try { data = raw ? JSON.parse(raw) : undefined; } catch { data = undefined; }

            if (!res.ok) {
                const details = data ? JSON.stringify(data, null, 2) : raw || '(no body)';
                console.error('Payment failed', {
                    status: res.status,
                    statusText: res.statusText,
                    body: data ?? raw
                });
                resultEl.innerHTML = `<div style="color:#b00020"><strong>Payment failed</strong><br>HTTP ${res.status} ${res.statusText}<pre>${details}</pre></div>`;
                return;
            }

            console.log('Payment Response:', data);
            if (data && data.status === 'pending') {
                console.warn('Payment is pending. Please check the payment provider for updates.');
            }
            resultEl.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        } catch (err) {
            console.error('Payment error:', err);
            resultEl.innerHTML = `<span style='color:red'>Payment request error: ${err.message}</span>`;
        }
    }

    mtnCard.addEventListener('click', () => renderForm('mtn'));
    orangeCard.addEventListener('click', () => renderForm('orange'));
});
