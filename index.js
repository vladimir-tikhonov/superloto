const PromisePool = require('es6-promise-pool');

const { checkTicket } = require('./src/api');
const CsvStorage = require('./src/CsvStorage');
const Tiket = require('./src/Tiket');

const draw = 661;

const storage = new CsvStorage(`./data/${draw}.csv`);

const buildTicket = (apiResponse, ticketNumber, suffix) => {
    const ticketData = apiResponse.ticket[suffix];

    const status = apiResponse.check_result;
    const prize = parseFloat(ticketData.prize_total) || 0;
    const comment = ticketData.prize_summary || '-';

    return new Tiket(ticketNumber, suffix, status, prize, comment);
};

function tiketsFetcher() {
    return storage.fetchNext((ticketNumber, suffix) => (
        checkTicket(draw, ticketNumber, suffix).then(response => (
            buildTicket(response, ticketNumber, suffix)
        ))
    ));
}

const pool = new PromisePool(tiketsFetcher, 10);
pool.start();
