// Initialize an array to store our event data
let events = [];

function recordEvent(event) {
    // Calculate x,y coordinates relative to the pitch's dimensions
    const x = (event.offsetX / event.target.offsetWidth) * 68;

    // This is the value to be stored for matplotlib plotting
    const y_flipped = 105 - (event.offsetY / event.target.offsetHeight) * 105;

    // Capture the current timestamp
    const timestamp = new Date().toISOString();

    // Store as an object for clarity
    events.push({ x, y: y_flipped, timestamp, category: null });

    // Provide visual feedback: create a small marker where the user clicked/touched
    let marker = document.createElement('div');
    marker.className = 'event-marker';
    marker.style.left = (x / 68 * 100) + '%';  // As a percentage of the container's width

    // Use the original y-coordinate (not y_flipped) for visual representation
    const y_original_percentage = (event.offsetY / event.target.offsetHeight) * 100;
    marker.style.top = y_original_percentage + '%';

    event.target.appendChild(marker);

    // Check if the toggle for event categorization is on or off
    const isCategorizationEnabled = document.getElementById('toggle-event-types').checked;

    // Show category selection popup only if categorization is enabled
    if (isCategorizationEnabled) {
        const categoryPopup = document.getElementById('categoryPopup');
        categoryPopup.style.display = 'block';
    } else {
        // Add a default category if categorization is not enabled
        events[events.length - 1].category = 'Uncategorized';
    }
}

function handleButtonClick(button) {
    button.classList.add('button-clicked');
    setTimeout(() => {
        button.classList.remove('button-clicked');
    }, 100); // Remove the class after 100 milliseconds
}

function cancelEvent() {
    events.pop();
    const pitchElement = document.querySelector('.pitch');
    const lastMarker = pitchElement.querySelector('.event-marker:last-child');
    if (lastMarker) lastMarker.remove();
    document.getElementById('categoryPopup').style.display = 'none';
}

function selectCategory(category) {
    const lastEvent = events[events.length - 1];
    if (lastEvent) {
        lastEvent.category = category;
    }
    // Hide the popup with a delay
    setTimeout(() => {
        document.getElementById('categoryPopup').style.display = 'none';
    }, 150);
}

function exportEvents() {
    // Initialize CSV content with headers for x, y, event, timestamp, id, and notes_manual
    let csvContent = 'x,y,event,timestamp,id,notes_manual\n';

    // Convert event data to CSV format
    events.forEach(entry => {
        const { x, y, timestamp, category } = entry;
        const cat = category || 'Uncategorized';

        // Create the id value
        const id = `${timestamp}_${x}_${y}_${cat}`.replace(/\s/g, '_').replace(/:/g, '-');

        // Leave notes_manual empty
        const notesManual = '';

        // Add the data to the CSV content
        csvContent += `${x},${y},${cat},${timestamp},${id},${notesManual}\n`;
    });

    // Create a downloadable file from CSV string
    let blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    let url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    let timestamp = new Date().toISOString().slice(0,19).replace("T", "_").replace(/:/g, "-");
    link.setAttribute("download", `matchlogger_log_${timestamp}_utc.csv`);
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

function viewHeatmap() {
    showHeatmap(events);
}

function resetEvents() {
    events = [];
    const markers = document.querySelectorAll('.event-marker');
    markers.forEach(marker => marker.remove());
}
