const progressFill = document.querySelector('.progress-fill');
const questionEl = document.getElementById('question');
const answersEl = document.getElementById('answers');
const resultEl = document.getElementById('result');
const scoreEl = document.getElementById('score');
const nextButton = document.getElementById('next');
const restartButton = document.getElementById('restart');
const toggleDarkButton = document.getElementById('toggle-dark');
const autoNextCheckbox = document.getElementById('auto-next');
const reviewContainer = document.querySelector('.review-container');
const reviewList = document.getElementById('review-list');

const correctSound = new Audio('correct.mp3');
const wrongSound = new Audio('wrong.mp3');

let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let answered = false;
let incorrectAnswers = [];
let delayTimeout;

fetch('questions.json')
  .then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();  // <-- parse JSON here
  })
  .then(data => {
    console.log('Questions JSON loaded:', data);
    questions = data; // assign JSON array directly
    if (questions.length > 0) {
      shuffleArray(questions);
      showQuestion();
    } else {
      questionEl.textContent = "No questions loaded.";
    }
  })
  .catch(err => {
    questionEl.textContent = "Failed to load questions.";
    console.error(err);
  });

function parseQuestions(text) {
  const blocks = text.trim().split(/\n(?=\d+\.)/);
  return blocks.map(block => {
    const lines = block.trim().split('\n');
    const question = lines[0].replace(/^\d+\.\s*/, '');
    const options = lines.slice(1).map(line => {
      let isCorrect = /\*\s*$/.test(line);
      let cleanedText = line.replace(/\*\s*$/, '').trim();
      cleanedText = cleanedText.replace(/^([a-dα-δΑ-Δ])\.\s*/i, '').trim();
      return { text: cleanedText, correct: isCorrect };
    });
    return { question, options };
  });
}

function showQuestion() {
  answered = false;
  clearTimeout(delayTimeout);
  nextButton.disabled = true;

  const current = questions[currentQuestionIndex];
  questionEl.textContent = current.question;
  answersEl.innerHTML = '';
  resultEl.textContent = '';

  const shuffledOptions = [...current.options];
  shuffleArray(shuffledOptions);

  shuffledOptions.forEach(option => {
    const btn = document.createElement('button');
    btn.classList.add('answer');
    btn.textContent = option.text;
    btn.onclick = () => handleAnswerClick(btn, option.correct);
    answersEl.appendChild(btn);
  });

  // Update progress bar
  const progressPercent = (currentQuestionIndex / questions.length) * 100;
  progressFill.style.width = progressPercent + '%';
}

function handleAnswerClick(button, isCorrect) {
  if (answered) return;
  answered = true;

  navigator.vibrate?.(100);

  const buttons = Array.from(answersEl.children);
  buttons.forEach(btn => btn.disabled = true);
  button.classList.add('pulse');

  setTimeout(() => {
    button.classList.remove('pulse');

    if (isCorrect) {
      correctSound.play();
      button.classList.add('correct');
      resultEl.textContent = "Correct!";
      score++;
    } else {
      wrongSound.play();
      button.classList.add('wrong');
      resultEl.textContent = "Wrong!";
      incorrectAnswers.push({
        ...questions[currentQuestionIndex],
        selected: button.textContent
      });

      buttons.forEach(btn => {
        if (btn.textContent.trim() === getCorrectAnswerText()) {
          btn.classList.add('correct');
        }
      });
    }

    scoreEl.textContent = `Score: ${score}`;

    if (autoNextCheckbox.checked) {
      delayTimeout = setTimeout(goToNextQuestion, 10000); // 10 seconds delay
    } else {
      nextButton.disabled = false;
    }
  }, 300);
}

function getCorrectAnswerText() {
  const current = questions[currentQuestionIndex];
  const correctOption = current.options.find(opt => opt.correct);
  return correctOption ? correctOption.text.trim() : "";
}

function goToNextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    showReview();
  }
}

nextButton.addEventListener('click', goToNextQuestion);

restartButton.addEventListener('click', () => {
  clearTimeout(delayTimeout);
  currentQuestionIndex = 0;
  score = 0;
  incorrectAnswers = [];
  scoreEl.textContent = "Score: 0";
  nextButton.disabled = true;

  reviewContainer.classList.add('hide');
  setTimeout(() => {
    reviewContainer.style.display = 'none';
    document.querySelector('.quiz-container').style.display = 'block';
    document.querySelector('.quiz-container').classList.remove('hide');
    shuffleArray(questions);
    showQuestion();
  }, 400);
});

toggleDarkButton.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function showReview() {
  document.querySelector('.quiz-container').style.display = 'none';
  reviewContainer.style.display = 'block';

  questionEl.textContent = "🎉 Quiz complete!";
  answersEl.innerHTML = '';
  resultEl.innerHTML = `Final Score: ${score}/${questions.length}<br/>Incorrect answers: ${incorrectAnswers.length}`;
  progressFill.style.width = '100%';

  reviewList.innerHTML = incorrectAnswers.map(q => {
    const correct = q.options.find(opt => opt.correct)?.text;
    return `
      <div class="review-question">
        <strong>${q.question}</strong><br>
        <span style="color: green;">Correct: ${correct}</span><br>
        <span style="color: red;">Your Answer: ${q.selected}</span>
      </div>
    `;
  }).join('');
}
