const DEFAULT_PROFILE = {
    "created_at": new Date().toISOString(),
    "total_sessions": 0,
    "overall_level": 1,
    "stats": {
        "working_memory": 50,
        "pattern_recognition": 50,
        "processing_speed": 50,
        "spatial_intelligence": 50,
        "mental_fortitude": 50,
        "psychological_insight": 50,
        "strategic_thinking": 50,
        "social_intelligence": 50
    },
    "modules": {
        "dual_nback":         {"best_n": 2, "current_n": 2, "sessions": [], "unlocked": true},
        "chimp_test":         {"best_level": 4, "current_level": 4, "sessions": [], "unlocked": true},
        "sequence_solver":    {"best_level": 1, "current_level": 1, "sessions": [], "unlocked": true},
        "schulte_table":      {"best_time": null, "grid_size": 5, "sessions": [], "unlocked": true},
        "speed_math":         {"best_streak": 0, "difficulty": 1, "sessions": [], "unlocked": false},
        "stroop_test":        {"best_score": 0, "speed": "normal", "sessions": [], "unlocked": false},
        "micro_expression":   {"best_score": 0, "flash_ms": 500, "sessions": [], "unlocked": true},
        "influence_tactics":  {"best_score": 0, "current_level": 1, "sessions": [], "unlocked": true},
        "strategic_gambit":   {"best_score": 0, "current_level": 1, "sessions": [], "unlocked": true},
        "deception_analysis": {"best_score": 0, "current_level": 1, "sessions": [], "unlocked": true},
        "psychology":         {"best_score": 0, "sessions": [], "unlocked": true}
    }
};

class CognitiveEngine {
    constructor() {
        this.profile = this.loadProfile();
        this.checkUnlocks();
    }

    loadProfile() {
        const stored = localStorage.getItem('ayanokoji_profile');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {}
        }
        return JSON.parse(JSON.stringify(DEFAULT_PROFILE));
    }

    saveProfile() {
        localStorage.setItem('ayanokoji_profile', JSON.stringify(this.profile));
    }

    getProfile() {
        return this.profile;
    }

    resetProfile() {
        this.profile = JSON.parse(JSON.stringify(DEFAULT_PROFILE));
        this.profile.created_at = new Date().toISOString();
        this.saveProfile();
        return this.profile;
    }

    getDifficulty(moduleName) {
        const mod = this.profile.modules[moduleName];
        if (!mod) return {};
        const mapping = {
            "dual_nback":         (m) => ({n: m.current_n}),
            "chimp_test":         (m) => ({level: m.current_level}),
            "sequence_solver":    (m) => ({level: m.current_level}),
            "schulte_table":      (m) => ({grid_size: m.grid_size}),
            "speed_math":         (m) => ({difficulty: m.difficulty}),
            "stroop_test":        (m) => ({speed: m.speed}),
            "micro_expression":   (m) => ({flash_ms: m.flash_ms}),
            "influence_tactics":  (m) => ({current_level: m.current_level}),
            "strategic_gambit":   (m) => ({current_level: m.current_level}),
            "deception_analysis": (m) => ({current_level: m.current_level}),
            "psychology":         (m) => ({})
        };
        const getter = mapping[moduleName];
        return getter ? getter(mod) : {};
    }

    saveResult(moduleName, resultData) {
        const mod = this.profile.modules[moduleName];
        if (!mod) return { error: "Invalid module" };

        const sessionEntry = {
            timestamp: new Date().toISOString(),
            score: resultData.score || 0,
            accuracy: resultData.accuracy || 0,
            time_ms: resultData.time_ms || 0,
            details: resultData.details || {}
        };

        mod.sessions.push(sessionEntry);
        if (mod.sessions.length > 50) {
            mod.sessions = mod.sessions.slice(-50);
        }

        this.profile.total_sessions += 1;

        this._updateModuleDifficulty(moduleName, mod, resultData);
        this._updateStats(moduleName, resultData);
        this.checkUnlocks();

        this.saveProfile();
        return this.profile;
    }

    _updateModuleDifficulty(moduleName, mod, resultData) {
        const accuracy = resultData.accuracy || 0;
        const recentSessions = mod.sessions.slice(-3);

        const consecutiveGood = recentSessions.filter(s => (s.accuracy || 0) >= 0.85).length;
        const consecutiveBad = recentSessions.filter(s => (s.accuracy || 0) < 0.50).length;

        if (moduleName === "dual_nback") {
            if (consecutiveGood >= 2) {
                mod.current_n += 1;
                if (mod.current_n > mod.best_n) mod.best_n = mod.current_n;
            } else if (consecutiveBad >= 2 && mod.current_n > 2) {
                mod.current_n -= 1;
            }
        } else if (moduleName === "chimp_test") {
            if ((resultData.score || 0) > 0 && accuracy === 1.0) {
                mod.current_level += 1;
                if (mod.current_level > mod.best_level) mod.best_level = mod.current_level;
            } else if (accuracy < 1.0 && mod.current_level > 4) {
                mod.current_level -= 1;
            }
        } else if (moduleName === "sequence_solver") {
            if (consecutiveGood >= 2) {
                mod.current_level += 1;
                if (mod.current_level > mod.best_level) mod.best_level = mod.current_level;
            } else if (consecutiveBad >= 2 && mod.current_level > 1) {
                mod.current_level -= 1;
            }
        } else if (moduleName === "schulte_table") {
            if (mod.best_time === null || (resultData.time_ms || 9999999) < mod.best_time) {
                mod.best_time = resultData.time_ms;
            }
            if (consecutiveGood >= 3 && mod.grid_size < 7) {
                mod.grid_size += 1;
            } else if (consecutiveBad >= 2 && mod.grid_size > 5) {
                mod.grid_size -= 1;
            }
        } else if (moduleName === "speed_math") {
            const streak = (resultData.details || {}).max_streak || 0;
            if (streak > mod.best_streak) mod.best_streak = streak;
            if (consecutiveGood >= 2) {
                mod.difficulty += 1;
            } else if (consecutiveBad >= 2 && mod.difficulty > 1) {
                mod.difficulty -= 1;
            }
        } else if (moduleName === "stroop_test") {
            const score = resultData.score || 0;
            if (score > mod.best_score) mod.best_score = score;
            if (consecutiveGood >= 2) {
                if (mod.speed === "normal") mod.speed = "hard";
                else if (mod.speed === "hard") mod.speed = "insane";
            } else if (consecutiveBad >= 2) {
                if (mod.speed === "insane") mod.speed = "hard";
                else if (mod.speed === "hard") mod.speed = "normal";
            }
        } else if (moduleName === "micro_expression") {
            const score = resultData.score || 0;
            if (score > mod.best_score) mod.best_score = score;
            if (consecutiveGood >= 2 && mod.flash_ms > 200) {
                mod.flash_ms = Math.max(200, mod.flash_ms - 50);
            } else if (consecutiveBad >= 2 && mod.flash_ms < 500) {
                mod.flash_ms = Math.min(500, mod.flash_ms + 50);
            }
        } else if (["influence_tactics", "strategic_gambit", "deception_analysis", "psychology"].includes(moduleName)) {
            const score = resultData.score || 0;
            if (score > mod.best_score) mod.best_score = score;
            if (moduleName !== "psychology") {
                if (consecutiveGood >= 2) {
                    mod.current_level += 1;
                } else if (consecutiveBad >= 2 && mod.current_level > 1) {
                    mod.current_level -= 1;
                }
            }
        }
    }

    _updateStats(moduleName, resultData) {
        const stats = this.profile.stats;
        const accuracy = resultData.accuracy || 0;
        const perfFactor = (accuracy - 0.5) * 5; // -2.5 to +2.5

        const statMap = {
            "dual_nback":         [["working_memory", 1.5], ["mental_fortitude", 0.5]],
            "chimp_test":         [["spatial_intelligence", 1.5], ["processing_speed", 0.5]],
            "sequence_solver":    [["pattern_recognition", 1.5], ["working_memory", 0.5]],
            "schulte_table":      [["processing_speed", 1.5], ["spatial_intelligence", 0.5]],
            "speed_math":         [["processing_speed", 1.0], ["pattern_recognition", 1.0]],
            "stroop_test":        [["mental_fortitude", 1.5], ["processing_speed", 0.5]],
            "micro_expression":   [["psychological_insight", 1.5], ["processing_speed", 0.5]],
            "influence_tactics":  [["social_intelligence", 1.5], ["psychological_insight", 0.5]],
            "strategic_gambit":   [["strategic_thinking", 1.5], ["pattern_recognition", 0.5]],
            "deception_analysis": [["psychological_insight", 1.5], ["pattern_recognition", 0.5]],
            "psychology":         [["psychological_insight", 2.0], ["social_intelligence", 1.0]]
        };

        const updates = statMap[moduleName] || [];
        updates.forEach(([statKey, weight]) => {
            stats[statKey] = this._clamp(stats[statKey] + perfFactor * weight);
        });

        let val = 1.0;
        Object.values(stats).forEach(s => {
            val *= Math.max(s, 1);
        });
        const numStats = Object.keys(stats).length;
        this.profile.overall_level = Math.max(1, Math.min(100, Math.floor(Math.pow(val, 1.0 / numStats))));
    }

    _clamp(val, minVal=0, maxVal=100) {
        return Math.max(minVal, Math.min(maxVal, Math.round(val)));
    }

    checkUnlocks() {
        const stats = this.profile.stats;
        const mods = this.profile.modules;

        if (!mods.speed_math.unlocked && stats.processing_speed >= 30 && stats.pattern_recognition >= 30) mods.speed_math.unlocked = true;
        if (!mods.stroop_test.unlocked && stats.mental_fortitude >= 25 && stats.processing_speed >= 35) mods.stroop_test.unlocked = true;
        if (!mods.micro_expression.unlocked && stats.psychological_insight >= 25) mods.micro_expression.unlocked = true;
        if (!mods.influence_tactics.unlocked && stats.social_intelligence >= 30 && stats.psychological_insight >= 30) mods.influence_tactics.unlocked = true;
        if (!mods.strategic_gambit.unlocked && stats.strategic_thinking >= 25 && stats.pattern_recognition >= 40) mods.strategic_gambit.unlocked = true;
        if (!mods.deception_analysis.unlocked && stats.psychological_insight >= 45 && stats.pattern_recognition >= 40) mods.deception_analysis.unlocked = true;
    }
}

window.engine = new CognitiveEngine();
