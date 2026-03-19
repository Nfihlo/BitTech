// Minimal stub for Concept Quest UI (for test.html)
// This file is expected to exist at ../static/js/concept_quest.js relative to env/test.html.

(function () {
  const STATUS_TITLE = document.querySelector('#cqStatus .dash-item-title');
  const STATUS_META = document.querySelector('#cqStatus .dash-item-meta');
  const FEEDBACK_META = document.getElementById('cqFeedbackMeta');
  const FEEDBACK_PILL = document.getElementById('cqFeedbackPill');
  const OBJECTIVE_EL = document.getElementById('cqObjective');
  const ACCURACY_EL = document.getElementById('cqAccuracy');
  const STREAK_EL = document.getElementById('cqStreak');
  const OBJ_META = document.getElementById('cqObjectiveMeta');

  function safeSet(el, text) {
    if (el) el.textContent = text;
  }

  function setStatus(title, meta) {
    safeSet(STATUS_TITLE, title);
    safeSet(STATUS_META, meta);
  }

  function setFeedback(message, pill) {
    safeSet(FEEDBACK_META, message);
    safeSet(FEEDBACK_PILL, pill);
  }

  function setStats({objective, accuracy, streak}) {
    safeSet(OBJECTIVE_EL, objective);
    safeSet(ACCURACY_EL, accuracy);
    safeSet(STREAK_EL, streak);
  }

  function init() {
    window.__bittech_conceptQuestLoaded = true;
    setStatus('Concept Quest loaded', 'Press Start to begin.');
    setFeedback('Ready', 'OK');
    setStats({objective: '—', accuracy: '—', streak: '—'});

    const box = document.getElementById('cqBox');
    const specEl = document.getElementById('conceptQuestSpec');
    const startBtn = document.getElementById('cqStart');
    const pauseBtn = document.getElementById('cqPause');
    const restartBtn = document.getElementById('cqRestart');

    const state = {
      spec: null,
      currentIndex: 0,
      correct: 0,
      total: 0,
      streak: 0,
      running: false,
      bricks: [], // Lego blocks built so far
    };

    function parseSpec() {
      if (!specEl) return null;
      try {
        return JSON.parse(specEl.textContent);
      } catch (err) {
        console.error('Failed to parse conceptQuestSpec JSON', err);
        return null;
      }
    }

    function updateStats() {
      if (!state.spec) return;
      setStats({
        objective: state.spec.title || '—',
        accuracy: state.total === 0 ? '—' : `${Math.round((state.correct / state.total) * 100)}%`,
        streak: `${state.streak}`,
      });
    }

    function clearBox() {
      if (!box) return;
      box.innerHTML = '';
    }

    function createElement(tag, attrs = {}, children = []) {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'text') {
          el.textContent = value;
        } else if (key === 'html') {
          el.innerHTML = value;
        } else if (key.startsWith('on') && typeof value === 'function') {
          el.addEventListener(key.slice(2), value);
        } else {
          el.setAttribute(key, value);
        }
      });
      children.forEach((child) => el.appendChild(child));
      return el;
    }

    function createLegoBrick(text, onClick) {
      const btn = createElement('button', {
        type: 'button',
        text,
        style:
          'background: linear-gradient(180deg, #f2a50b, #c2760c); border: 2px solid #b37b09; border-radius: 10px; padding: 10px 12px; color: #0b1220; font-weight: 700; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.25);',
        onclick: onClick,
      });

      const knobs = createElement('div', {style: 'display: flex; gap: 6px; margin-bottom: 6px;'});
      for (let i = 0; i < 4; i += 1) {
        knobs.appendChild(createElement('div', {
          style:
            'width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.9); box-shadow: inset 0 0 2px rgba(0,0,0,0.3);',
        }));
      }

      btn.prepend(knobs);
      return btn;
    }

    function renderLegoStack() {
      if (!box) return;
      const stackWrapper = createElement('div', {
        style:
          'display: flex; flex-direction: column-reverse; align-items: center; gap: 8px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: 14px; min-height: 120px; margin-bottom: 14px;',
      });

      if (state.bricks.length === 0) {
        stackWrapper.textContent = 'No bricks yet. Answer a question to build!';
        stackWrapper.style.color = 'rgba(229, 231, 235, 0.8)';
      } else {
        state.bricks.forEach((text) => {
          const brick = createLegoBrick(text, () => {});
          brick.style.width = 'calc(100% - 20px)';
          brick.style.maxWidth = '220px';
          stackWrapper.appendChild(brick);
        });
      }

      return stackWrapper;
    }

    function renderQuestion() {
      if (!box || !state.spec) return;
      const terms = state.spec.terms || [];
      if (!terms.length) {
        box.textContent = 'No terms provided in the spec.';
        return;
      }

      const term = terms[state.currentIndex % terms.length];
      const choices = shuffleArray([...terms])
        .slice(0, 4)
        .map((t) => t.definition);

      if (!choices.includes(term.definition)) {
        choices[0] = term.definition;
      }

      clearBox();

      const stack = renderLegoStack();
      const title = createElement('div', {
        class: 'title',
        text: `Build: ${state.spec.title || 'LEGO Quest'}`,
      });
      const prompt = createElement('div', {
        class: 'meta',
        text: `Select the correct definition for “${term.term}”:`,
      });
      const choicesGrid = createElement('div', {
        style: 'display: grid; gap: 10px; margin-top: 12px; grid-template-columns: repeat(auto-fit,minmax(180px,1fr));',
      });

      choices.forEach((choice) => {
        const btn = createLegoBrick(choice, () => {
          const correct = choice === term.definition;
          state.total += 1;
          state.correct += correct ? 1 : 0;
          state.streak = correct ? state.streak + 1 : 0;

          if (correct) {
            state.bricks.push(term.term);
            setFeedback('Correct! Brick placed.', 'Nice');
            updateStats();
            state.currentIndex += 1;
            window.setTimeout(renderQuestion, 800);
          } else {
            setFeedback('Wrong — try again', 'Oops');
            state.streak = 0;
            updateStats();
          }
        });

        choicesGrid.appendChild(btn);
      });

      const help = createElement('div', {
        class: 'meta',
        text: 'Correct answers add LEGO bricks to your tower. Keep building!',
      });

      box.appendChild(stack);
      box.appendChild(title);
      box.appendChild(prompt);
      box.appendChild(choicesGrid);
      box.appendChild(help);
    }

    function shuffleArray(array) {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    function startGame() {
      if (!state.spec) return;
      state.running = true;
      setStatus('Running', 'Answer the questions in the box.');
      setFeedback('Pick a definition', 'Go');
      renderQuestion();
      updateStats();
    }

    function pauseGame() {
      state.running = false;
      setStatus('Paused', 'Game is paused.');
      setFeedback('Paused', 'Pause');
      clearBox();
      if (box) box.textContent = 'Paused — click Start to continue.';
    }

    function restartGame() {
      state.currentIndex = 0;
      state.correct = 0;
      state.total = 0;
      state.streak = 0;
      state.bricks = [];
      setStatus('Restarted', 'Game has been restarted.');
      setFeedback('Restarted', 'OK');
      updateStats();
      if (state.running) {
        renderQuestion();
      } else if (box) {
        box.textContent = 'Restarted — click Start to play.';
      }
    }

    state.spec = parseSpec();
    if (!state.spec) {
      setStatus('Error', 'Could not parse game spec.');
      setFeedback('Spec error', 'Error');
      if (box) box.textContent = 'Unable to load game data. Check that the JSON is valid.';
      return;
    }

    if (OBJ_META) {
      OBJ_META.textContent = state.spec.objectives?.map((o) => o.text).join(' / ') || 'No objectives provided.';
    }

    if (box) {
      box.textContent = 'Click Start to begin the game.';
    }

    if (startBtn) startBtn.addEventListener('click', () => {
      if (!state.running) startGame();
    });
    if (pauseBtn) pauseBtn.addEventListener('click', pauseGame);
    if (restartBtn) restartBtn.addEventListener('click', restartGame);
  }

  // Run immediately, even if DOM not fully loaded (script is deferred in test.html)
  init();
})();
