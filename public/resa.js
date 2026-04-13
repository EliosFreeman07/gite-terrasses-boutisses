// 1) SELECTION DATE DEBUT ET DATE FIN
// a) Conversion de la date du jour
const today = new Date().toISOString().split("T")[0];

start_date.min = today;
start_date.value = today;

console.log(today);


// b) Calcul de la date du lendemain
let tomorrowS = new Date();
tomorrowS.setDate(tomorrowS.getDate()+1);

console.log(tomorrowS);


// c) Conversion de la date du lendemain
let tomorrow = tomorrowS.toISOString().split("T")[0];

end_date.min = tomorrow;
end_date.value = tomorrow;


// d) La date de début ne peut pas être supérieure à la date de fin => créer un évènement
start_date.addEventListener('change', (e) => {
    if (start_date.value >= end_date.value) {
        let day = new Date(start_date.value);
        day.setDate(day.getDate()+1);
        end_date.value = day.toISOString().split("T")[0];
    }
    bookingCalcul();
})

// e) La date de fin ne peut pas être inférieure à la date de début => créer un évènement
end_date.addEventListener('change', (e) => {
    if(end_date.value <= start_date.value) {
        let day = new Date(end_date.value);
        day.setDate(day.getDate()-1);
        start_date.value = day.toISOString().split("T")[0];
    }
    bookingCalcul();
})


// 2) CALCUL DU TOTAL
const total = document.getElementById('total');
const people = document.getElementById('people')

const bookingCalcul = () => {
    if(!start_date.value || !end_date.value) {
        total.textContent = "";
        return;
    }

    let diffTime = Math.abs(new Date(end_date.value) - new Date(start_date.value));
    let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    total.textContent = diffDays * prixNuit.textContent * people.value;
}

// start_date.addEventListener("change", bookingCalcul);
// end_date.addEventListener("change", bookingCalcul);
people.addEventListener("change", bookingCalcul);

bookingCalcul();




// 3) Menu déroulant pour le nombre de personnes
const select = document.getElementById("people");

for (let i = 1; i <= 15; i++) {
  const option = document.createElement("option");
  option.value = i;
  option.textContent = i;
  select.appendChild(option);
}

bookingCalcul();


// 4) VALIDATION FORMULAIRE
const bookingForm = document.querySelector('.bookingForm');

bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const debut  = start_date.value;
    const fin    = end_date.value;
    const nuits  = Math.round(Math.abs(new Date(fin) - new Date(debut)) / (1000 * 60 * 60 * 24));
    const msg    = document.getElementById('formMessage');

    const donnees = {
        nom:         document.getElementById('nom').value,
        prenom:      document.getElementById('prenom').value,
        email:       document.getElementById('email').value,
        phone:       document.getElementById('phone').value,
        nbPersonnes: people.value,
        startDate:   debut,
        endDate:     fin,
        nbNuits:     nuits,
        prixTotal:   nuits * parseInt(prixNuit.textContent) * parseInt(people.value),
    };

    try {
        const reponse = await fetch('/api/reservations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(donnees)
        });

        const resultat = await reponse.json();
        msg.textContent = resultat.message;
        msg.style.color = resultat.success ? 'green' : 'red';

        if (resultat.success) {
            bookingForm.reset();
            // Réinitialiser les dates et le total après reset
            start_date.value = today;
            end_date.value = tomorrow;
            bookingCalcul();
        }
    } catch (err) {
        msg.textContent = 'Une erreur est survenue. Réessayez plus tard.';
        msg.style.color = 'red';
    }
});
