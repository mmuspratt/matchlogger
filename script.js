// Initialize an array to store our event data
let events = [];

function recordEvent(event) {
    // Calculate x,y coordinates relative to the pitch's dimensions
    const x = (event.offsetX / event.target.offsetWidth) * 68;
    
    // This is the value to be stored for matplotlib plotting
    const y_flipped = 105 - (event.offsetY / event.target.offsetHeight) * 105; 

    // Capture the current timestamp
    const timestamp = new Date().toISOString();

   // Store the x,y coordinates and timestamp with y_flipped for storage
    events.push([x, y_flipped, timestamp]);
    
    // Provide visual feedback: create a small marker where the user clicked/touched
    let marker = document.createElement('div');
    marker.className = 'event-marker';
    marker.style.left = (x / 68 * 100) + '%';  // As a percentage of the container's width
    
    // Use the original y-coordinate (not y_flipped) for visual representation
    const y_original_percentage = (event.offsetY / event.target.offsetHeight) * 100;
    marker.style.top = y_original_percentage + '%'; 

    event.target.appendChild(marker);
    
    // Show category selection popup in the center of the pitch
    const categoryPopup = document.getElementById('categoryPopup');
    categoryPopup.style.display = 'block';
}

function handleButtonClick(button) {
    button.classList.add('button-clicked');
    setTimeout(() => {
        button.classList.remove('button-clicked');
    }, 100); // Remove the class after 100 milliseconds
}

function selectCategory(category) {
    const lastEvent = events[events.length - 1];
    if (lastEvent) {
        lastEvent.push(category);
    }
    // Hide the popup with a delay
    setTimeout(() => {
        document.getElementById('categoryPopup').style.display = 'none';
    }, 150); // Adjust the delay as needed
}

function exportEvents() {
    // Initialize CSV content with headers for x, y, event, timestamp, id, and notes_manual
    let csvContent = 'x,y,event,timestamp,id,notes_manual\n';

    // Convert event data to CSV format
    events.forEach(event => {
        const x = event[0];
        const y = event[1];
        const timestamp = event[2];
        const category = event[3] || 'Uncategorized';

        // Create the id value
        const id = `${timestamp}_${x}_${y}_${category}`.replace(/\s/g, '_').replace(/:/g, '-'); // Replace spaces and colons for a cleaner ID

        // Leave notes_manual empty
        const notesManual = '';

        // Add the data to the CSV content
        csvContent += `${x},${y},${category},${timestamp},${id},${notesManual}\n`;
    });

    // Create a downloadable file from CSV string
    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    let url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    let timestamp = new Date().toISOString().slice(0,19).replace("T", "_").replace(/:/g, "-");
    link.setAttribute("download", `match_log_${timestamp}_utc.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function undoLastEvent() {
    // Remove the last event from the events array
    if (events.length > 0) {
        events.pop();
    }

    // Remove the last event marker from the pitch
    const pitchElement = document.querySelector('.pitch');
    const lastMarker = pitchElement.querySelector('.event-marker:last-child');
    if (lastMarker) {
        lastMarker.remove();
    }
}

function resetEvents() {
    events = [];
    const markers = document.querySelectorAll('.event-marker');
    markers.forEach(marker => marker.remove());
}
