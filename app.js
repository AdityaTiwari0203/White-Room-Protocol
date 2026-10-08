// State
let profile = null;
let currentModuleId = null;
let radarChart = null;

const screens = {
    boot: document.getElementById('boot-screen'),
    dashboard: document.getElementById('dashboard-screen'),
    module: document.getElementById('module-screen'),
    results: document.getElementById('results-screen'),
    calibration: document.getElementById('calibration-screen')
};

const moduleDefinitions = [
    // -- COGNITIVE --
    { id: 'dual_nback', title: 'DUAL N-BACK', desc: 'Working Memory & Divided Attention', category: 'cognitive' },
    { id: 'chimp_test', title: 'CHIMP TEST', desc: 'Eidetic & Spatial Memory', category: 'cognitive' },
    { id: 'sequence_solver', title: 'SEQUENCE SOLVER', desc: 'Fluid Intelligence & Logic', category: 'cognitive' },
    { id: 'schulte_table', title: 'SCHULTE TABLE', desc: 'Peripheral Vision & Speed', category: 'cognitive' },
    { id: 'speed_math', title: 'SPEED MATH', desc: 'Mental Arithmetic under pressure', category: 'cognitive', req: 'SPD≥30, PAT≥30' },
    { id: 'stroop_test', title: 'STROOP TEST', desc: 'Cognitive Inhibition', category: 'cognitive', req: 'MTL≥25, SPD≥35' },
    // -- SOCIAL INTELLIGENCE --
    { id: 'micro_expression', title: 'MICRO-EXPRESSION', desc: 'Reading Emotions at Speed', category: 'social', req: 'PSY≥25' },
    { id: 'influence_tactics', title: 'INFLUENCE TACTICS', desc: 'Persuasion & Social Dynamics', category: 'social', req: 'SOC≥30, PSY≥30' },
    { id: 'strategic_gambit', title: 'STRATEGIC GAMBIT', desc: 'Game Theory & Decision-Making', category: 'social', req: 'STR≥25, PAT≥40' },
    { id: 'deception_analysis', title: 'DECEPTION ANALYSIS', desc: 'Lie Detection via Linguistic Cues', category: 'social', req: 'PSY≥45, PAT≥40' },
    { id: 'psychology', title: 'PSYCHOLOGY DOJO', desc: 'LLM Negotiation & Behavioral Profiling', category: 'social' }
];

// Initialize
async function init() {
    simulateBoot();
    try {
        profile = window.engine.getProfile();
    } catch(e) {
        console.error("Failed to get profile:", e);
        document.getElementById('boot-text').innerText = 'ERROR - RETRYING...';
        setTimeout(init, 2000);
        return;
    }
    setTimeout(() => {
        if (profile.total_sessions === 0) {
            initCalibration();
        } else {
            renderDashboard();
            showScreen('dashboard');
        }
    }, 1500);
}

let calibStartTime = 0;

function initCalibration() {
    showScreen('calibration');
    calibStartTime = Date.now();
    
    document.getElementById('btn-calib-1').addEventListener('click', () => {
        document.getElementById('calib-step-1').style.display = 'none';
        document.getElementById('calib-step-2').style.display = 'block';
    });
    
    document.getElementById('btn-calib-2').addEventListener('click', async () => {
        const a1 = document.getElementById('calib-q1').value.trim();
        const a2 = document.getElementById('calib-q2').value.trim().toUpperCase();
        
        let score = 0;
        if (a1 === "50") score += 50; // 15% of 240 is 36, + 14 = 50. Correct.
        if (a2 === "YES") score += 50; // Utilitarian choice.
        
        const timeTaken = Date.now() - calibStartTime;
        
        const mockResult = {
            score: score,
            accuracy: score / 100,
            time_ms: timeTaken
        };
        
        document.getElementById('btn-calib-2').disabled = true;
        document.getElementById('btn-calib-2').innerText = 'CALIBRATING...';
        
        profile = window.engine.saveResult('speed_math', mockResult);
        profile = window.engine.saveResult('psychology', mockResult);
        
        renderDashboard();
        showScreen('dashboard');
    });
}

function simulateBoot() {
    const bar = document.getElementById('boot-progress');
    const text = document.getElementById('boot-text');
    let p = 0;
    const interval = setInterval(() => {
        p += Math.random() * 20;
        if(p > 100) p = 100;
        bar.style.width = p + '%';
        if(p === 100) {
            clearInterval(interval);
            text.innerText = 'SYSTEM READY';
        }
    }, 100);
}

function showScreen(screenId) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenId].classList.add('active');
}

function getGradeTitle(level) {
    if(level <= 10) return 'NOVICE';
    if(level <= 25) return 'TRAINEE';
    if(level <= 40) return 'OPERATIVE';
    if(level <= 55) return 'SPECIALIST';
    if(level <= 70) return 'TACTICIAN';
    if(level <= 85) return 'ELITE';
    if(level <= 95) return 'GRADUATE';
    return 'AYANOKOJI';
}

function renderDashboard() {
    document.getElementById('overall-level').innerText = `Lv. ${profile.overall_level}`;
    document.getElementById('grade-title').innerText = getGradeTitle(profile.overall_level);
    document.getElementById('total-sessions').innerText = profile.total_sessions;

    renderRadarChart();
    renderModuleGrid();
}

function renderRadarChart() {
    const ctx = document.getElementById('stat-radar').getContext('2d');
    const data = [
        profile.stats.working_memory,
        profile.stats.pattern_recognition,
        profile.stats.processing_speed,
        profile.stats.spatial_intelligence,
        profile.stats.mental_fortitude,
        profile.stats.psychological_insight,
        profile.stats.strategic_thinking,
        profile.stats.social_intelligence
    ];

    if(radarChart) radarChart.destroy();

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['MEMORY', 'PATTERN', 'SPEED', 'SPATIAL', 'FORTITUDE', 'PSYCHOLOGY', 'STRATEGY', 'SOCIAL'],
            datasets: [{
                label: 'Cognitive Profile',
                data: data,
                backgroundColor: 'rgba(0, 229, 255, 0.15)',
                borderColor: 'rgba(0, 229, 255, 1)',
                pointBackgroundColor: 'rgba(0, 229, 255, 1)',
                pointBorderColor: '#fff',
                borderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
                    grid: { color: 'rgba(255, 255, 255, 0.08)' },
                    pointLabels: {
                        color: '#8a8d9e',
                        font: { family: "'JetBrains Mono', monospace", size: 9, weight: 700 }
                    },
                    ticks: { display: false },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderModuleGrid() {
    const container = document.getElementById('modules-container');
    container.innerHTML = '';

    // Group by category
    const categories = [
        { key: 'cognitive', label: 'COGNITIVE TRAINING' },
        { key: 'social', label: 'SOCIAL INTELLIGENCE' }
    ];

    categories.forEach(cat => {
        // Category label
        const label = document.createElement('div');
        label.className = 'module-category-label';
        label.innerText = cat.label;
        container.appendChild(label);

        // Module cards for this category
        const catModules = moduleDefinitions.filter(d => d.category === cat.key);
        catModules.forEach(def => {
            const modData = profile.modules[def.id];
            if (!modData) return;
            const isLocked = !modData.unlocked;
            const isSocial = cat.key === 'social';

            const card = document.createElement('div');
            card.className = `module-card ${isLocked ? 'locked' : ''} ${isSocial ? 'social' : ''}`;

            let statsHtml = '';
            if(isLocked) {
                statsHtml = `<div>REQ: ${def.req || '???'}</div>`;
            } else {
                if(def.id === 'dual_nback') statsHtml = `<div>Current N: ${modData.current_n}</div>`;
                else if(def.id === 'chimp_test') statsHtml = `<div>Level: ${modData.current_level}</div>`;
                else if(def.id === 'sequence_solver') statsHtml = `<div>Level: ${modData.current_level}</div>`;
                else if(def.id === 'schulte_table') statsHtml = `<div>Grid: ${modData.grid_size}x${modData.grid_size}</div>`;
                else if(def.id === 'speed_math') statsHtml = `<div>Difficulty: ${modData.difficulty}</div>`;
                else if(def.id === 'stroop_test') statsHtml = `<div>Speed: ${modData.speed}</div>`;
                else if(def.id === 'micro_expression') statsHtml = `<div>Flash: ${modData.flash_ms}ms</div>`;
                else if(def.id === 'influence_tactics') statsHtml = `<div>Level: ${modData.current_level}</div>`;
                else if(def.id === 'strategic_gambit') statsHtml = `<div>Level: ${modData.current_level}</div>`;
                else if(def.id === 'deception_analysis') statsHtml = `<div>Level: ${modData.current_level}</div>`;
                else if(def.id === 'psychology') statsHtml = `<div>High Score: ${modData.best_score}</div>`;
            }

            card.innerHTML = `
                <h3>${def.title}</h3>
                <div class="module-stats-preview">${def.desc}<br><br>${statsHtml}</div>
                <button class="btn ${isSocial ? 'btn-social' : 'btn-outline'}" ${isLocked ? 'disabled' : ''}>BEGIN</button>
            `;

            if(!isLocked) {
                card.querySelector('button').addEventListener('click', () => startModule(def.id));
            }

            container.appendChild(card);
        });
    });
}

// Module Execution
async function startModule(moduleId) {
    currentModuleId = moduleId;
    const def = moduleDefinitions.find(d => d.id === moduleId);

    document.getElementById('active-module-title').innerText = def.title;
    document.getElementById('module-score').innerText = 'SCORE: 0';
    document.getElementById('module-timer').innerText = '00:00';
    document.getElementById('module-content-area').innerHTML = '';

    showScreen('module');

    try {
        const difficulty = window.engine.getDifficulty(moduleId);

        if(!window[moduleId + '_init']) {
            await loadScript(`modules/${moduleId}.js`);
        }

        window[moduleId + '_init'](document.getElementById('module-content-area'), difficulty, finishModule);
    } catch(e) {
        console.error("Module start error:", e);
        document.getElementById('module-content-area').innerHTML = `<div style="color:var(--error);text-align:center;"><h2>MODULE ERROR</h2><p>${e.message || e}</p><p>Check console for details.</p></div>`;
    }
}

document.getElementById('btn-abort').addEventListener('click', () => {
    if(window[currentModuleId + '_destroy']) window[currentModuleId + '_destroy']();
    showScreen('dashboard');
});

window.updateModuleTimer = (str) => { document.getElementById('module-timer').innerText = str; };
window.updateModuleScore = (score) => { document.getElementById('module-score').innerText = 'SCORE: ' + score; };

async function finishModule(resultData) {
    if(window[currentModuleId + '_destroy']) window[currentModuleId + '_destroy']();

    document.getElementById('res-score').innerText = resultData.score;
    document.getElementById('res-accuracy').innerText = Math.round((resultData.accuracy || 0) * 100) + '%';
    document.getElementById('res-time').innerText = (resultData.time_ms / 1000).toFixed(1) + 's';

    const oldStats = { ...profile.stats };

    profile = window.engine.saveResult(currentModuleId, resultData);

    const deltasContainer = document.getElementById('stat-deltas');
    deltasContainer.innerHTML = '';

    const statLabels = {
        working_memory: 'WORKING MEMORY',
        pattern_recognition: 'PATTERN RECOGNITION',
        processing_speed: 'PROCESSING SPEED',
        spatial_intelligence: 'SPATIAL INTELLIGENCE',
        mental_fortitude: 'MENTAL FORTITUDE',
        psychological_insight: 'PSYCHOLOGICAL INSIGHT',
        strategic_thinking: 'STRATEGIC THINKING',
        social_intelligence: 'SOCIAL INTELLIGENCE'
    };

    for(const key in profile.stats) {
        const diff = profile.stats[key] - (oldStats[key] || 0);
        if(diff !== 0) {
            const el = document.createElement('div');
            el.className = `delta-line ${diff > 0 ? 'positive' : 'negative'}`;
            el.innerHTML = `<span>${statLabels[key] || key.toUpperCase()}</span> <span>${diff > 0 ? '+' : ''}${diff}</span>`;
            deltasContainer.appendChild(el);
        }
    }
    if(deltasContainer.innerHTML === '') deltasContainer.innerHTML = '<div class="delta-line" style="color:var(--text-muted)">NO CHANGE</div>';

    showScreen('results');
}

document.getElementById('btn-dashboard').addEventListener('click', () => {
    renderDashboard();
    showScreen('dashboard');
});
document.getElementById('btn-retry').addEventListener('click', () => {
    startModule(currentModuleId);
});

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.body.appendChild(s);
    });
}

window.addEventListener('DOMContentLoaded', () => {
    init();
});
