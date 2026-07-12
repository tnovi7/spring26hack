const STORAGE = {
    student: 'spring26hack_student',
    complaints: 'spring26hack_complaints',
    seatRows: 'spring26hack_seatrows',
    ledger: 'spring26hack_ledger',
    sos: 'spring26hack_sos',
};
const impeachmentTarget = 10;

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
    roll.addEventListener('input', () => {
        const val = roll.value.trim();
        nameInput.value = val ? `Anon-${val.slice(-4)}` : '';
    });
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const rollNumber = roll.value.trim();
        if (!rollNumber) return;
        const student = {roll: rollNumber, name: `Anon-${rollNumber.slice(-4)}`};
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
        complaints.push({category, details, timestamp: new Date().toISOString()});
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
            <label>Handicapped / disabled</label>
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
        const sorted = [...rows].sort((a, b) => a.height - b.height);
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
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const text = document.querySelector('#syllabus-input').value;
        output.textContent = summarizeSyllabus(text);
    });
}

function updateLedgerSummary(entries) {
    const cash = entries.filter((entry) => entry.type === 'cash').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    const items = entries.filter((entry) => entry.type === 'item').reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    document.querySelector('#total-cash').textContent = `৳ ${cash}`;
    document.querySelector('#total-items').textContent = items;
    return {cash, items};
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
    const entries = readStorage(STORAGE.ledger, []);
    const renderEntries = (list) => {
        feed.innerHTML = '';
        list.slice().reverse().forEach((entry) => feed.appendChild(createLedgerEntryCard(entry)));
    };
    const renderHeatmap = (list) => {
        const now = new Date();
        const counts = {};
        for (let i = 0; i < 30; i += 1) {
            const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            counts[day.toISOString().slice(0, 10)] = 0;
        }
        list.forEach((entry) => {
            const date = new Date(entry.timestamp).toISOString().slice(0, 10);
            if (counts[date] !== undefined) counts[date] += entry.type === 'cash' ? 1 : 1;
        });
        heatmap.innerHTML = '';
        Object.keys(counts).reverse().forEach((date) => {
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
        const newEntry = {type, amount, description, timestamp: new Date().toISOString()};
        const updated = [...entries, newEntry];
        writeStorage(STORAGE.ledger, updated);
        renderEntries(updated);
        updateLedgerSummary(updated);
        renderHeatmap(updated);
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
        const alert = {location, note: `SOS from ${location}`, timestamp: new Date().toISOString()};
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

const KNOWN_RULES = [
    {rule: 'Study hour is compulsory after 9 PM', keywords: ['study hour', 'compulsory', '9 PM']},
    {rule: 'No one can leave class before the captain says so', keywords: ['leave class', 'captain says']},
    {rule: 'All students must pay for their own tiffin', keywords: ['pay', 'tiffin', 'own']},
    {rule: 'Library access is only allowed with a captain pass', keywords: ['library access', 'captain pass']},
    {rule: 'Mobile phones are banned in corridors', keywords: ['mobile phones', 'corridors', 'banned']},
];

function verifyClaim(claim) {
    const normalized = claim.toLowerCase();
    const match = KNOWN_RULES.find((entry) => entry.keywords.every((keyword) => normalized.includes(keyword)));
    if (match) {
        return {verdict: 'Legit', match: match.rule};
    }
    return {verdict: 'Made up', match: 'No matching rule found.'};
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
    if (window.location.pathname === '/rules/') setupRulesPage();
}

document.addEventListener('DOMContentLoaded', bootstrap);
