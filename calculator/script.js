const display = document.getElementById('display');
const buttons = document.querySelectorAll('.btn');

let currentInput = '';
let resultDisplayed = false;

buttons.forEach(button => {
  button.addEventListener('click', () => handleInput(button.dataset.value));
});

function handleInput(value) {
  if (value === 'C') {
    currentInput = '';
    display.innerText = '0';
  } else if (value === '=') {
    try {
      // Prevent evaluating incomplete expressions like "3+"
      if (/[\+\-\*\/.]$/.test(currentInput)) {
        display.innerText = 'Incomplete';
        return;
      }

      const evaluated = eval(currentInput);
      currentInput = evaluated.toString();
      display.innerText = currentInput;
      resultDisplayed = true;
    } catch {
      display.innerText = 'Error';
      currentInput = '';
    }
  } else {
    if (resultDisplayed && /[0-9.]/.test(value)) {
      currentInput = value;
    } else {
      currentInput += value;
    }
    display.innerText = currentInput;
    resultDisplayed = false;
  }
}

// Keyboard support
document.addEventListener('keydown', e => {
  const key = e.key;

  if (key === 'Enter') {
    e.preventDefault(); // Prevent form submission
    handleInput('=');
  } else if (key === 'Backspace') {
    currentInput = currentInput.slice(0, -1);
    display.innerText = currentInput || '0';
  } else if ('0123456789+-*/.=cC'.includes(key)) {
    if (key === 'c' || key === 'C') handleInput('C');
    else if (key === '=') handleInput('=');
    else handleInput(key);
  }
});
