export class SpellBook {
    constructor(data) {
        this.traditions = data;
    }

    get getSpellBook() {
        return this.traditions;
    }
}

export class Tradition {
    constructor(data) {
        this.tradition = data;
        this.spells = [];
    }

    get getTradition() {
        return this.data;
    }

    get getSpells() {
        return this.spells;
    }

    set setSpell(spell) {
        this.spells.push(spell);
    }
}

export class Spell {
    constructor(data) {
        this.data = data;
    }

    get getSpell() {
        return this.data;
    }
}
