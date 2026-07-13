// NOTE: In production, never expose secret keys in frontend JS!
const TEACHER_SECRET_KEY = 'spring26hack-super-secret-captain-key';

function encryptRollNumber(rollNumber) {
    if (!rollNumber) return '';
    // Encrypts the roll number and formats it as a URL-safe Base64 string
    const ciphertext = CryptoJS.AES.encrypt(rollNumber, TEACHER_SECRET_KEY).toString();
    return `Anon-${ciphertext}`;
}

function decryptRollNumber(anonId) {
    try {
        // Strip the 'Anon-' prefix before decrypting
        const cleanCiphertext = anonId.replace(/^Anon-/, '');
        const bytes = CryptoJS.AES.decrypt(cleanCiphertext, TEACHER_SECRET_KEY);
        const originalRoll = bytes.toString(CryptoJS.enc.Utf8);
        return originalRoll || 'Decryption failed (Invalid Key)';
    } catch (error) {
        return 'Decryption failed (Corrupted Data)';
    }
}

const STORAGE = {
    student: 'spring26hack_student',
    complaints: 'spring26hack_complaints',
    seatRows: 'spring26hack_seatrows',
    ledger: 'spring26hack_ledger',
    sos: 'spring26hack_sos',
};
const impeachmentTarget = 3;

// Helper: read a cookie (used for Django CSRF token)
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function readStorage(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getStudent() {
    return readStorage(STORAGE.student, null);
}

function redirectToLogin() {
    if (window.location.pathname !== '/login/') {
        window.location.href = '/login/';
    }
}

function initLogout() {
    const logout = document.querySelector('#logout');
    if (!logout) return;
    logout.addEventListener('click', () => {
        localStorage.removeItem(STORAGE.student);
        window.location.href = '/login/';
    });
}

function setupLoginPage() {
    const form = document.querySelector('#login-form');
    if (!form) return;
    const roll = document.querySelector('#roll-number');
    const nameInput = document.querySelector('#roll-name');

    // Updated: Generates the AES encrypted string as the user types
    roll.addEventListener('input', () => {
        const val = roll.value.trim();
        nameInput.value = val ? encryptRollNumber(val) : '';
    });

    // Updated: Saves the AES encrypted string into local storage upon submission
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const rollNumber = roll.value.trim();
        if (!rollNumber) return;
        const student = { roll: rollNumber, name: encryptRollNumber(rollNumber) };
        writeStorage(STORAGE.student, student);
        window.location.href = '/dashboard/';
    });
}

function requireLogin() {
    const student = getStudent();
    if (!student) {
        redirectToLogin();
        return false;
    }
    return true;
}

function renderDashboard() {
    if (!requireLogin()) return;
    const student = getStudent();
    const complaints = readStorage(STORAGE.complaints, []);
    const submitted = complaints.length;
    const left = Math.max(impeachmentTarget - submitted, 0);
    document.querySelector('#submitted-count').textContent = submitted;
    document.querySelector('#impeach-left').textContent = left;
    document.querySelector('#anon-name').textContent = student.name;
}

function setupComplaintPage() {
    if (!requireLogin()) return;
    const form = document.querySelector('#complaint-form');
    const countEl = document.querySelector('#complaint-count');
    const leftEl = document.querySelector('#complaint-left');
    const updateCounts = () => {
        const complaints = readStorage(STORAGE.complaints, []);
        countEl.textContent = complaints.length;
        leftEl.textContent = Math.max(impeachmentTarget - complaints.length, 0);
    };
    updateCounts();
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const category = document.querySelector('#complaint-category').value;
        const details = document.querySelector('#complaint-text').value.trim();
        const complaints = readStorage(STORAGE.complaints, []);
        complaints.push({ category, details, timestamp: new Date().toISOString() });
        writeStorage(STORAGE.complaints, complaints);
        updateCounts();
        form.reset();
    });
}

function createSeatRow(index, values) {
    const row = document.createElement('div');
    row.className = 'row-card';
    row.innerHTML = `
        <h3>Student row ${index + 1}</h3>
        <div class="form-row">
            <label>Name</label>
            <input type="text" name="name" placeholder="Student name" value="${values?.name || ''}" required>
            <label>Roll Number</label>
            <input type="text" name="roll" placeholder="Roll number" value="${values?.roll || ''}" required>
            <label>Height (cm)</label>
            <input type="number" name="height" min="100" placeholder="Height" value="${values?.height || ''}" required>
            <label>Handicapped / Disabled</label>
            <select name="handicap">
                <option value="false" ${values?.handicap === false ? 'selected' : ''}>No</option>
                <option value="true" ${values?.handicap === true ? 'selected' : ''}>Yes</option>
            </select>
        </div>
        <div class="row-actions">
            <button type="button" class="secondary-button remove-row">Remove</button>
        </div>
    `;
    row.querySelector('.remove-row').addEventListener('click', () => {
        row.remove();
    });
    return row;
}

function setupSeatplanPage() {
    if (!requireLogin()) return;
    const container = document.querySelector('#seat-rows');
    const addRowBtn = document.querySelector('#add-row');
    const form = document.querySelector('#seatplan-form');
    const grid = document.querySelector('#seat-grid');
    const restore = readStorage(STORAGE.seatRows, []);
    const renderRow = (values) => container.appendChild(createSeatRow(container.children.length, values));
    if (restore.length) restore.forEach(renderRow);
    if (!container.children.length) renderRow({});
    addRowBtn.addEventListener('click', () => renderRow({}));
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const rows = Array.from(container.children).map((row) => ({
            name: row.querySelector('[name="name"]').value.trim(),
            roll: row.querySelector('[name="roll"]').value.trim(),
            height: Number(row.querySelector('[name="height"]').value),
            handicap: row.querySelector('[name="handicap"]').value === 'true',
        })).filter((item) => item.name && item.roll && item.height);
        writeStorage(STORAGE.seatRows, rows);
        const sorted = [...rows].sort((a, b) => {
            if (a.handicap !== b.handicap) {
                return a.handicap ? -1 : 1;
            }
            return a.height - b.height;
        });
        const cols = Math.min(6, Math.max(3, Math.ceil(sorted.length / 2)));
        grid.style.gridTemplateColumns = `repeat(${cols}, minmax(120px, 1fr))`;
        grid.innerHTML = '';
        sorted.forEach((student, index) => {
            grid.appendChild(createSeatCard(student, index + 1));
        });
    });
}

function createSeatCard(student, seatNumber) {
    const card = document.createElement('div');
    card.className = 'seat-card';
    card.innerHTML = `
        <strong>${student.name}</strong>
        <div><small>Roll: ${student.roll}</small></div>
        <div><small>Height: ${student.height} cm</small></div>
        <div><small>${student.handicap ? 'Accessible seat' : 'Standard seat'}</small></div>
        <div><small>Seat #${seatNumber}</small></div>
    `;
    return card;
}

function summarizeSyllabus(text) {
    const cleaned = text.replace(/\s+/g, ' ').trim();
    if (!cleaned) return 'Enter a syllabus to see a summary.';
    const sentences = cleaned.split(/(?<=[.!?])\s+/).slice(0, 8);
    const bullets = sentences.map((sentence) => {
        let trimmed = sentence.trim();
        if (trimmed.length > 80) trimmed = trimmed.slice(0, 80).replace(/\s+$/, '') + '...';
        return `• ${trimmed}`;
    });
    if (bullets.length === 0) bullets.push('• No syllabus content detected.');
    return bullets.join('\n');
}

function setupAIPage() {
    if (!requireLogin()) return;
    const form = document.querySelector('#ai-form');
    const output = document.querySelector('#ai-output');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = document.querySelector('#syllabus-input').value.trim();
        
        if (!text) {
            output.textContent = 'Please enter a syllabus to summarize.';
            return;
        }
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'Summarizing...';
        output.textContent = 'Processing with Gemini AI...';
        
        try {
            const csrftoken = getCookie('csrftoken');
            const response = await fetch('/api/ai/summarize/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken || ''
                },
                body: JSON.stringify({ syllabus: text }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
                output.textContent = data.summary;
            } else {
                output.textContent = `Error: ${data.error || 'Unknown error'}`;
            }
        } catch (error) {
            output.textContent = `Failed to summarize: ${error.message}`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Summarize';
        }
    });
}

function updateLedgerSummary(entries) {
    const cash = entries.filter((entry) => entry.type === 'cash').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const items = entries.filter((entry) => entry.type === 'item').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    document.querySelector('#total-cash').textContent = `৳ ${cash}`;
    document.querySelector('#total-items').textContent = items;
    return { cash, items };
}

function createLedgerEntryCard(entry) {
    const item = document.createElement('div');
    item.className = 'ticker-entry';
    item.innerHTML = `
        <strong>${entry.type === 'cash' ? 'Forced payment' : 'Stolen item'}</strong>
        <div>${entry.description || 'No details provided'}</div>
        <small>${entry.amount} ${entry.type === 'cash' ? 'Tk' : 'item(s)'} · ${new Date(entry.timestamp).toLocaleString()}</small>
    `;
    return item;
}

function setupLedgerPage() {
    if (!requireLogin()) return;
    const form = document.querySelector('#ledger-form');
    const feed = document.querySelector('#ledger-feed');
    const heatmap = document.querySelector('#heatmap-grid');
    let entries = readStorage(STORAGE.ledger, []);
    const renderEntries = (list) => {
        feed.innerHTML = '';
        list.slice().reverse().forEach((entry) => feed.appendChild(createLedgerEntryCard(entry)));
    };
    const renderHeatmap = (list) => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const counts = {};
        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = new Date(year, month, day);
            counts[date.toISOString().slice(0, 10)] = 0;
        }
        list.forEach((entry) => {
            const date = new Date(entry.timestamp).toISOString().slice(0, 10);
            const amount = Number(entry.amount) || 1;
            if (counts[date] !== undefined) counts[date] += amount;
        });
        heatmap.innerHTML = '';
        Object.keys(counts).forEach((date) => {
            const count = counts[date];
            const level = Math.min(5, Math.ceil(count / 2));
            const cell = document.createElement('div');
            cell.className = `heatmap-cell level-${level || 1}`;
            cell.title = `${count} incident(s)`;
            cell.textContent = `${count}`;
            heatmap.appendChild(cell);
        });
    };
    renderEntries(entries);
    updateLedgerSummary(entries);
    renderHeatmap(entries);
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const type = document.querySelector('#ledger-type').value;
        const amount = Number(document.querySelector('#ledger-amount').value) || 0;
        const description = document.querySelector('#ledger-description').value.trim();
        const newEntry = { type, amount, description, timestamp: new Date().toISOString() };
        entries = [...readStorage(STORAGE.ledger, []), newEntry];
        writeStorage(STORAGE.ledger, entries);
        renderEntries(entries);
        updateLedgerSummary(entries);
        renderHeatmap(entries);
        form.reset();
    });
}

function setupSOSPage() {
    if (!requireLogin()) return;
    const form = document.querySelector('#sos-form');
    const history = document.querySelector('#sos-history');
    const alerts = readStorage(STORAGE.sos, []);
    const render = (list) => {
        history.innerHTML = '';
        list.slice().reverse().forEach((item) => {
            const node = document.createElement('div');
            node.className = 'ticker-entry';
            node.innerHTML = `
                <strong>${item.location}</strong>
                <div>${item.note || 'Danger zone alert'}</div>
                <small>${new Date(item.timestamp).toLocaleString()}</small>
            `;
            history.appendChild(node);
        });
    };
    render(alerts);
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const location = document.querySelector('#sos-location').value;
        const alert = { location, note: `SOS from ${location}`, timestamp: new Date().toISOString() };
        const updated = [...alerts, alert];
        writeStorage(STORAGE.sos, updated);
        render(updated);
        window.alert('SOS alert sent. Stay safe!');
    });
}

function renderCaptainPage() {
    if (!requireLogin()) return;
    const ticker = document.querySelector('#captain-ticker');
    const history = document.querySelector('#captain-alert-history');
    const alerts = readStorage(STORAGE.sos, []);
    ticker.innerHTML = '';
    history.innerHTML = '';
    alerts.slice().reverse().forEach((item) => {
        const entry = document.createElement('div');
        entry.className = 'ticker-entry';
        entry.textContent = `DISTRESS: ${item.location} · ${new Date(item.timestamp).toLocaleTimeString()}`;
        ticker.appendChild(entry);
        const detail = document.createElement('div');
        detail.className = 'ticker-entry';
        detail.innerHTML = `<strong>${item.location}</strong><div>${item.note}</div><small>${new Date(item.timestamp).toLocaleString()}</small>`;
        history.appendChild(detail);
    });
}

let KNOWN_RULES = [];

function loadRules() {
    return fetch('/static/rules.json')
        .then((response) => response.json())
        .then((data) => {
            KNOWN_RULES = data;
            return KNOWN_RULES;
        })
        .catch((error) => {
            console.error('Failed to load rules:', error);
            return [];
        });
}

function verifyClaim(claim) {
    const normalized = claim.toLowerCase();
    const match = KNOWN_RULES.find((entry) => entry.keywords.every((keyword) => normalized.includes(keyword)));
    if (match) {
        return { verdict: 'Legit', match: match.rule };
    }
    return { verdict: 'Made up', match: 'No matching rule found.' };
}

function setupRulesPage() {
    if (!requireLogin()) return;
    const form = document.querySelector('#rules-form');
    const verdict = document.querySelector('#rule-verdict');
    const match = document.querySelector('#rule-match');
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const claim = document.querySelector('#rule-claim').value.trim();
        const result = verifyClaim(claim);
        verdict.textContent = result.verdict;
        verdict.style.color = result.verdict === 'Legit' ? '#7bf000' : '#ff5968';
        match.textContent = `Matching rule: ${result.match}`;
    });
}

function bootstrap() {
    initLogout();
    setupLoginPage();
    if (window.location.pathname === '/dashboard/' || window.location.pathname === '/') renderDashboard();
    if (window.location.pathname === '/complaints/') setupComplaintPage();
    if (window.location.pathname === '/seatplan/') setupSeatplanPage();
    if (window.location.pathname === '/ai/') setupAIPage();
    if (window.location.pathname === '/ledger/') setupLedgerPage();
    if (window.location.pathname === '/sos/') setupSOSPage();
    if (window.location.pathname.startsWith('/captain/')) renderCaptainPage();
    if (window.location.pathname === '/rules/') {
        loadRules().then(() => setupRulesPage());
    }
}

document.addEventListener('DOMContentLoaded', bootstrap);
