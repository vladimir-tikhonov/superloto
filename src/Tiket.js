const DID_NOT_WIN_STATUS = 'not_win';

class Ticket {
    constructor(ticketNumber, suffix, status, prize, comment) {
        this.id = `${ticketNumber}-${suffix}`.padStart(8, 0);
        this.number = ticketNumber;
        this.suffix = suffix;

        this.status = status;
        this.prize = prize;
        this.comment = comment;
    }

    didWin() {
        return this.status !== DID_NOT_WIN_STATUS;
    }
}

module.exports = Ticket;
