"use strict";

import StorageAdministrator from "../../../general/StorageAdministrator.js";

class IdeStorage extends StorageAdministrator {
    constructor() {
        super();

        /**
         * @type {{new: boolean, ast: RSast}}
         */
        this.program = {
            new : false,
            ast : null
        }

        const w1 = document.querySelector(".window-editor");
        const w2 = document.querySelector(".window-interpreter");
        let width = 0, height = 0;
        if (w1.clientWidth > 0 && w1.clientWidth < 1440) {
            width = w1.clientWidth;
            height = w1.clientHeight;
        } else {
            width = w2.clientWidth;
            height = w2.clientHeight;
        }

        this.camera = {
            scale : 1,
            origin : {
                x : 0,
                y : 0
            },
            width : width,
            height : height
        }

        this.items = {
            flowers : [],
            papers : []
        }
    }
    /**
     * Loads a RobotScript ast passed by argument, if its null it removes the last ast if any was loaded
     * @param {RSast|null} newProgram 
     */
    loadProgram ( newProgram ) {
        if (!newProgram) {
            this.program.new = false;
            this.program.ast = null;
        }
        else {
            this.program.new = true;
            this.program.ast = newProgram;
        }
    }

    /**
     * If a RobotScript ast was loaded it returns it, if not return null
     * @returns {RSast|null} a {@link RSast} or null
     */
    getProgram () {
        return this.program.ast;
    }

    addItems (config) {
        config.items.forEach(newI => {
            
            const addedIndex = this.items[config.type].findIndex(oldI => (oldI.x === newI.x && oldI.y === newI.y));

            if (addedIndex === -1) this.items[config.type].push(newI);
            else this.items[config.type][addedIndex].quantity += newI.quantity;
        });   
    };
    clearItems (config) {
        for (let i=0; i<this.items.flowers.length; i++) {
            const f = this.items.flowers[i];
            if (f.x >= config.x.min && f.x <= config.x.max && f.y >= config.y.min && f.y <= config.y.max ) {
                this.items.flowers.splice(i, 1);
                i--;
            }
        };
        for (let i=0; i<this.items.papers.length; i++) {
            const f = this.items.papers[i];
            if (f.x >= config.x.min && f.x <= config.x.max && f.y >= config.y.min && f.y <= config.y.max ) {
                this.items.papers.splice(i, 1);
                i--;
            }
        };
    }
}

export default IdeStorage;
