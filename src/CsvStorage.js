const _ = require('lodash');
const fs = require('fs');
const ParaParse = require('papaparse');

const Ticket = require('./Tiket');

const MAX_DIRTY_RECORDS = 100;

class CsvStorage {
    constructor(filepath) {
        this.filepath = filepath;
        this.storage = new Map();
        this.queue = new Map();
        this.dirtyRecordsCount = 0;
        this.lastFetchedTicketNumber = 1;

        this.restoreFromFile();
    }

    fetchNext(fetcher) {
        const [ticketNumber, suffix] = this.getNextNumberAndSuffixToProcess();
        console.log(`${ticketNumber}-${suffix}`);
        this.addToQueue(ticketNumber, suffix);
        this.lastFetchedTicketNumber = ticketNumber;

        return fetcher(ticketNumber, suffix).then((ticket) => {
            this.addToStorage(ticket);
            this.removeFromQueue(ticketNumber, suffix);
            this.dirtyRecordsCount += 1;

            if (this.dirtyRecordsCount > MAX_DIRTY_RECORDS) {
                this.dumpToFile();
            }
        });
    }

    addToStorage(ticket) {
        const ticketNumber = ticket.number;
        const ticketsForNumber = this.storage.get(ticketNumber) || [];
        this.storage.set(ticketNumber, [...ticketsForNumber, ticket]);
    }

    addToQueue(ticketNumber, suffix) {
        if (!this.queue.has(ticketNumber)) {
            this.queue.set(ticketNumber, new Set());
        }

        this.queue.get(ticketNumber).add(suffix);
    }

    removeFromQueue(ticketNumber, suffix) {
        if (!this.queue.has(ticketNumber)) {
            throw new Error(`There is no such element in queue: ${ticketNumber}-${suffix}`);
        }

        this.queue.get(ticketNumber).delete(suffix);
    }

    hasInQueue(ticketNumber, suffix) {
        if (!this.queue.has(ticketNumber)) {
            return false;
        }

        return this.queue.get(ticketNumber).has(suffix);
    }

    getNextNumberAndSuffixToProcess() {
        let currentTicketNumber = this.lastFetchedTicketNumber;

        for (;;) {
            const suffixesInStorage = this.storage.has(currentTicketNumber) ?
                this.storage.get(currentTicketNumber).map(ticket => ticket.suffix) :
                [];
            const suffixesInQueue = this.queue.has(currentTicketNumber) ?
                [...this.queue.get(currentTicketNumber)] :
                [];

            const missingSuffixes = _.difference(
                [1, 2, 3],
                [...suffixesInStorage, ...suffixesInQueue],
            );
            if (missingSuffixes.length > 0) {
                return [currentTicketNumber, missingSuffixes[0]];
            }

            currentTicketNumber += 1;
        }
    }

    restoreFromFile() {
        if (!fs.existsSync(this.filepath)) {
            return;
        }

        const csv = fs.readFileSync(this.filepath, { encoding: 'utf8' });
        const { data } = ParaParse.parse(csv, { header: true });
        data.forEach((ticketData) => {
            const ticket = new Ticket(
                parseInt(ticketData.number, 10),
                parseInt(ticketData.suffix, 10),
                ticketData.status,
                parseFloat(ticketData.prize),
                ticketData.comment,
            );
            this.addToStorage(ticket);
        });
    }

    dumpToFile() {
        const fields = ['id', 'number', 'suffix', 'status', 'prize', 'comment'];
        const data = [];
        this.storage.forEach((tickets) => {
            tickets.forEach((ticket) => {
                data.push([
                    ticket.id,
                    ticket.number,
                    ticket.suffix,
                    ticket.status,
                    ticket.prize,
                    ticket.comment,
                ]);
            });
        });

        const sortedData = _.sortBy(data, element => element[0]);
        const csv = ParaParse.unparse({ fields, data: sortedData });
        fs.writeFileSync(this.filepath, csv, { encoding: 'utf8' });
        this.dirtyRecordsCount = 0;
    }
}

module.exports = CsvStorage;
