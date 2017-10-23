const rp = require('request-promise-native');

function checkTicket(drawing, number, suffux) {
    const formData = {
        check: 'Y',
        drawing,
        ticket_number: String(number).padStart(6, 0),
        ticket_suffix: suffux,
    };

    return rp.post({ url: 'http://loto.by/results/proverka-bileta/ajax.php', formData })
        .then(response => JSON.parse(response));
}

module.exports = {
    checkTicket,
};
