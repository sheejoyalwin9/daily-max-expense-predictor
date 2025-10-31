document.getElementById('expenseForm').addEventListener('submit', function(e) {
    e.preventDefault();
    calculateBudget();
});

function calculateBudget() {
    // 1. Get Input Values
    const S = parseFloat(document.getElementById('salary').value) || 0;
    const R = parseFloat(document.getElementById('rent').value) || 0;
    const RT = parseFloat(document.getElementById('reqTravel').value) || 0;
    const WM = parseFloat(document.getElementById('wkndMeals').value) || 0;
    const WMT = parseFloat(document.getElementById('wkndTravel').value) || 0;
    const SV = parseFloat(document.getElementById('saving').value) || 0;
    const P = parseFloat(document.getElementById('parents').value) || 0;
    const budgetMonthValue = document.getElementById('budgetMonth').value;

    if (!budgetMonthValue) {
        alert("Please select a month to budget.");
        return;
    }

    // Parse the selected month
    const [year, month] = budgetMonthValue.split('-').map(Number);
    
    // 2. Calculate Tithe (T) and Fixed Expenses (F)
    const T = S * 0.10; // Tithe is 10% of salary
    
    const F = T + R + RT + WM + WMT + SV + P;

    // 3. Determine Disposable Income (D)
    const D = S - F;
    
    if (D < 0) {
        alert("Warning: Your fixed expenses exceed your monthly salary! Your daily budget will be negative.");
    }

    // Get the number of days in the selected month
    // Note: month - 1 because Date month is 0-indexed (Jan=0, Feb=1, etc.)
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // 4. Calculate Max Daily Expense (MDE)
    const MDE = D / daysInMonth;

    // 5. Generate and Display the Calendar Matrix
    generateCalendar(year, month, daysInMonth, MDE);
}

function generateCalendar(year, month, daysInMonth, MDE) {
    const calendarBody = document.getElementById('calendarBody');
    calendarBody.innerHTML = ''; // Clear previous entries
    document.getElementById('calendarHeader').style.display = 'block';

    for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month - 1, i); // month is 0-indexed
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const row = calendarBody.insertRow();
        
        // Date and Day
        row.insertCell().textContent = i;
        row.insertCell().textContent = dayOfWeek;

        // Max Daily Budget (This cell will be updated by updateCarryover)
        const budgetCell = row.insertCell();
        budgetCell.classList.add('daily-budget', `budget-day-${i}`);
        budgetCell.textContent = '$' + MDE.toFixed(2); // Initial base value

        // Actual Spent Input (Editable)
        const actualSpentCell = row.insertCell();
        const input = document.createElement('input');
        input.type = 'number';
        input.classList.add('form-control', 'form-control-sm', 'actual-spent');
        input.style.textAlign = 'center';
        input.value = '0'; // Default actual spent is 0
        input.min = '0';
        input.step = '0.01';
        input.setAttribute('data-day', i);
        actualSpentCell.appendChild(input);

        // Remaining/Carryover Cell
        const carryoverCell = row.insertCell();
        carryoverCell.classList.add('carryover-value', `carryover-day-${i}`);

        // Attach event listener to recalculate on spent change
        // We only need to attach the listener once for any change in the table.
        // The listener is added in the main loop of this function.
    }
    
    // 6. Attach ONE event listener to the whole table body for efficiency
    calendarBody.addEventListener('input', (e) => {
        if (e.target.classList.contains('actual-spent')) {
            updateCarryover(daysInMonth, MDE);
        }
    });

    // Run initial update for a clean display
    updateCarryover(daysInMonth, MDE);
}

function updateCarryover(daysInMonth, MDE) {
    let currentCarryover = 0; // Starts at 0 for day 1

    for (let i = 1; i <= daysInMonth; i++) {
        const budgetCell = document.querySelector(`.budget-day-${i}`); 
        const actualInput = document.querySelector(`.actual-spent[data-day="${i}"]`);
        const carryoverCell = document.querySelector(`.carryover-day-${i}`);

        // Update the current day's **Dynamic Budget**
        const currentBudget = MDE + currentCarryover;
        if (budgetCell) budgetCell.textContent = '$' + currentBudget.toFixed(2);
        
        // Calculate the day's result
        const actualSpent = parseFloat(actualInput.value) || 0;
        const dayCarryover = currentBudget - actualSpent;
        
        // Update the current day's carryover display
        if (carryoverCell) {
            carryoverCell.textContent = '$' + dayCarryover.toFixed(2);
            carryoverCell.classList.remove('text-success', 'text-danger');
            
            // Apply color coding
            if (dayCarryover >= 0) {
                carryoverCell.classList.add('text-success'); // In budget
            } else {
                carryoverCell.classList.add('text-danger'); // Over budget
            }
        }

        // The carryover for the *next* day is the result of *this* day
        currentCarryover = dayCarryover;
    }
}