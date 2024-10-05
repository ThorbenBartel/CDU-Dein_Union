document.getElementById('infoForm').addEventListener('submit', function (event) {
    event.preventDefault();
    
    const birthdate = document.getElementById('birthdate').value;
    const postalcode = document.getElementById('postalcode').value;
    const gender = document.getElementById('gender').value;

    // Daten in localStorage speichern
    localStorage.setItem('birthdate', birthdate);
    localStorage.setItem('postalcode', postalcode);
    localStorage.setItem('gender', gender);

    // Weiterleitung zum Quiz
    window.location.href = 'quiz.html';
});