"use strict";

/**
 * General types
 * 
 * @module validateAst
 * 
 * @typedef {{type: string, operator?: string, lhs?: string, rhs?: string, identifier?: string, value?: number|boolean}} expression
 * 
 * @typedef {{type_value: string, identifier: string}} variable
 * 
 * @typedef {{type: string, identifier?: string, value?: expression, body?: statement[], condition?: expression, arg1?: {type:string, value: string}|expression, arg2?: expression, min?: expression, max?: expression, x?: expression, y?: expression, who?: string, mode?: string, parameters?: parameter[]}} statement
 * 
 * 
 * @typedef {{type: string, identifier: string}} name
 * 
 * @typedef {{type_parameter: string, identifier: string, type_value: string}} parameter
 * @typedef {{identifier: string, parameters: parameter[], local_variables: variable[], body: statement[]}} procedure
 * @typedef {{identifier: string, parameters: parameter[]}} validProcedure
 * 
 * @typedef {{x: number, y: number}} point
 * @typedef {{identifier: string, type: string, a: point, b: point}} area
 * 
 * @typedef {{identifier: string, local_variables: variable[], body: statement[]}} robot
 * 
 * @typedef {{identifier: string, type: string}} instance
 * 
 * @typedef {{identifier: string, type: string}} assign_area
 * @typedef {{identifier: string, type: string[], value: number}} assign_item
 * @typedef {{identifier: string, x: number, y:number}} assign_origin
 * @typedef {{assign_areas: assign_area[], assign_items: assign_item[], assign_origins: assign_origin[]}} init
 * 
 * @typedef {{NAME: name, PROCEDURES: procedure[], AREAS: area[], ROBOT_TYPES: robot[], INSTANCES: instance[], INITS: init[]}} RSast
 * 
 * @typedef {{type: string, value: RSast}} RSProgram
 * 
 * @typedef {{ast: RSProgram | null, error: string | null, errors: object[] | null}} transpalingResult
 * 
 */

class ValidationResult {
    constructor() {
        /**
         * @type {boolean}
         */
        this.error = false;
        /**
         * @type {string}
         */
        this.type = "";
        /**
         * @type {string}
         */
        this.context = "";
    }

    /**
     * 
     * @param {string} type 
     * @param {string} context 
     */
    setError( type, context ) {
        this.error = true;
        this.type = type;
        this.context = context;
    }
    /**
     * Add additional message to the actual context
     * @param {string} additionalContext 
     */
    addContext( additionalContext ) {
        this.context = `${this.context}${additionalContext}`;
    }
    /**
     * Change the existing context with the new
     * @param {string} newContext 
     */
    setContext( newContext ) {
        this.context = newContext;
    }
    /**
     * Takes an ValidationResult to update itself
     * @param {ValidationResult} newError 
     */
    update( newResult ) {
        this.error = newResult.error;
        this.type = newResult.type;
        this.context = newResult.context;
    }
}



/**
 * Takes a point and returns if it belongs to the square defined by a - b
 * @param {point} base {@link point}
 * @param {point} a left bottom point
 * @param {point} b right top point
 * @returns {boolean}
 */
const pointInArea = ( base, a, b ) => {
    const xInRange = (base.x >= a.x) && (base.x <= b.x);
    const yInRange = (base.y >= a.y) && (base.y <= b.y);

    return (xInRange && yInRange);
}

/**
 * Take an array of objects an returns a new array with the string contained in the identifier property of every element if it exist
 * @param {object[]} baseArray 
 * @returns {string[]}
 */
 const getIdentifiers = ( baseArray ) => {
    /**
     * @type {string[]}
     */
    let identifiers = [];

    if ( baseArray && (baseArray.length > 0)) {
        baseArray.forEach( e => {
            if (e.identifier) {
                identifiers.push(e.identifier);
            }
        })
    }
    return identifiers;
}
/**
 * Take an string and returns if it's in the string[]
 * @param {string} identifier 
 * @param {string[]} validIdentifiers 
 * @returns {boolean}
 */
 const identifierExist = ( identifier, validIdentifiers ) => {
    let match = false;
    for (const possibleId of validIdentifiers) {
        if (possibleId === identifier) {
            match = true;
            break;
        };
    }
    return match;
}
/**
 * Takes an array of objects and returns a ValidationResult error if two objects have same identifiers
 * @param {object[]} baseArray 
 * @returns a {@link ValidationResult}
 */
const identifiersAreUnique = (baseArray) => {
    const r = new ValidationResult();
    if (baseArray.length === 0) return r;

    for(let i = 0; i < baseArray.length; i++) {
        const idBase = baseArray[i].identifier;

        for(let j = 0; j < i; j++) {
            const idComp = baseArray[j].identifier;

            if (idBase === idComp) {
                r.setError(
                    ``,
                    `Identificador '${idComp}' se encuentra en la declaracion ${j + 1} y ${i + 1}`
                );
                break;
            }     
        }
        if (r.error) break;
    }

    return r;
}

/**
 * Take an array of objects and return an array of objects that contain the identifier and type_value from the base array
 * @param {variable[]|parameter[]} baseArray 
 * @returns a {@link variable}[]
 */
const getVariables = ( baseArray ) => {
    /**
     * @type {variable[]}
     */
    let variables = [];

    if ( baseArray && (baseArray.length > 0)) {
        baseArray.forEach( e => {
            variables.push({
                identifier : e.identifier,
                type_value : e.type_value
            });
        })
    }
    return variables;
}
/**
 * 
 * @param {procedure[]} baseProcedures  
 * @returns a {@link validProcedure}[]
 */
const getValidProcedures = ( baseProcedures ) => {
    /**
     * @type {validProcedure[]}
     */
    const procedures = [];
    
    if ( baseProcedures && (baseProcedures.length > 0)) {
        baseProcedures.forEach( e => {
            const identifier = e.identifier;
            const parameters = e.parameters;
            procedures.push({
                identifier : identifier,
                parameters : parameters
            })
        })
    }

    return procedures;
}


/**
 * Take an array of areas and returns if they area valid
 * @param {area[]} areas 
 * @returns a {@link ValidationResult}
 */
const validateAreas = (areas) => {
    /**
     * Takes point a,b and return if a is minor or equal than b
     * @param {point} p1 
     * @param {point} p2 
     * @returns {boolean}
     */
    const pointsInOrder = ( p1, p2 ) => {
        const xInOrder = (p1.x <= p2.x);
        const yInOrder = (p1.y <= p2.y);

        return (xInOrder && yInOrder);
    }

    /**
     * Takes point a1,b1,a2,b2 and returns if the area defined by a1,b1 overlaps with area defined by a2,b2
     * @param {point} a1 
     * @param {point} b1 
     * @param {point} a2 
     * @param {point} b2 
     * @returns {boolean}
     */
    const areasOverlap = ( a1, b1, a2, b2 ) => {
        if (b1.x < a2.x) return false;

        if (a1.y > b2.y) return false;

        if (a1.x > b2.x) return false;

        if (b1.y < a2.y) return false;

        return true;
    }

    const r = new ValidationResult();

    for(let i = 0; i < areas.length; i++) {
        const nameBase = areas[i].identifier;
        const aBase = areas[i].a;
        const bBase = areas[i].b;

        const aValid = pointInArea(aBase, {x: 1, y: 1}, {x: 100, y: 100});
        const bValid = pointInArea(bBase, {x: 1, y: 1}, {x: 100, y: 100});

        if (!(aValid && bValid)) {
            r.setError(`Invalida declaracion de area`);
            if (!aValid && bValid) {
                r.setContext(`Coordenadas del primer punto del area '${nameBase}' debe estar en el rango de 1 a 100 en cada eje`);
            }
            else if (aValid && !bValid) {
                r.setContext(`Coordenadas del segundo punto del area '${nameBase}' debe estar en el rango de 1 a 100 en cada eje`);
            }
            else {
                r.setContext(`Coordenadas de ambos puntos del area '${nameBase}' deben estar en el rango de 1 a 100 en cada eje`);
            }
            break;
        }

        if (!pointsInOrder(aBase, bBase)) {
            r.setError(
                `Invalida declaracion de area`,
                `Coordenadas del segundo punto del area '${nameBase}' deben ser mayores o igual a las del primer punto`
            );
            break; 
        }

        for(let j = 0; j < i; j++) {
            const nameComp = areas[j].identifier;
            const aComp = areas[j].a;
            const bComp = areas[j].b;

            if (nameBase === nameComp) {
                r.setError(
                    `Invalida declaracion de area`,
                    `Identificador '${nameComp}' se utiliza en la declaracion del area ${j + 1} y ${i + 1}`
                );
                break;
            }

            if (areasOverlap(aComp, bComp, aBase, bBase)) {
                r.setError(
                    `Invalida declaracion de area`,
                    `El area '${nameComp}' comparte puntos con el area '${nameBase}'`
                );
                break;
            }            
        }

        if (r.error) break;
    }

    return r;
}

/**
 * Take an array of instances and array of robot types an return if the instances are valid
 * @param {instance[]} instances 
 * @param {robot[]} robot_types 
 * @returns a {@link ValidationResult}
 */
const validateInstances = (instances, robot_types) => {
    const r = new ValidationResult();
    
    const validRobotTypes = getIdentifiers(robot_types);

    const rIU = identifiersAreUnique(instances);
    if (rIU.error) {
        r.setError(
            `Invalida declaracion de instancia`,
            `${rIU.context} de las variables robots`
        )
    }

    for(let i = 0; i < instances.length; i++) {
        const nameBase = instances[i].identifier;
        const typeBase = instances[i].type;
        
        if (!identifierExist(typeBase, validRobotTypes)) {
            r.setError(
                `Invalida declaracion de instancia`,
                `Tipo de robot '${typeBase}' no fue declarado y se uso en la declaracion de instancia ${i + 1}`
            );
            break;
        }
    }

    return r;
}

/**
 * Take an array of instances and array of robot types an return if the instances are valid
 * @param {init} inits
 * @param {instance[]} instances 
 * @param {area[]} areas 
 * @returns a {@link ValidationResult}
 */
const validateInits = (inits, instances, areas) => {
    const r = new ValidationResult();
    /**
     * @typedef {{type: string, a: point, b: point, max: number, uses: number}} validArea
     * @type {validArea[]}
     */
    const validAreas = [];
    areas.forEach(area => {
        let max = 0;

        if (area.type === "SHARED") {
            max = instances.length;
        }
        else if (area.type === "SEMI_PRIVATE") {
            if (instances.length === 1) {
                max = 1
            } else {
                max = (instances.length - 1)
            }
        }
        else if (area.type === "PRIVATE") {
            max = 1;
        }

        /**
         * @type {validArea}
         */
        const validArea = {
            type : area.identifier,
            a : area.a,
            b : area.b,
            max : max,
            uses : 0,
        }

        validAreas.push(validArea);
    });

    /**
     * @typedef {{identifier: string, areas: string[], inventory: {flower: number, paper: number}, origin: {x: number, y: number}}} validInstance
     * @type {validInstance[]}
     */
    const validInstances = [];
    instances.forEach(instance => {
        /**
         * @type {validInstance[]}
         */
        const validInstance = {
            identifier : instance.identifier,
            areas : [],
            inventory : {
                flower : null,
                paper : null
            },
            origin : {}
        }

        validInstances.push(validInstance);
    })

    const assigns = inits.assign_areas;
    
    for(let i = 0; i < assigns.length; i++) {
        const identifier = assigns[i].identifier;
        const type = assigns[i].type;
        const areaIndex = validAreas.findIndex( e => e.type === type);

        if (areaIndex === -1) {
            r.setError(
                `Invalida asignacion de area`,
                `Tipo de area '${type}' no fue declarada y se usa en la asignacion de area ${i + 1}`
            );
            break;
        }

        if (validAreas[areaIndex].max === validAreas[areaIndex].uses) {
            r.setError(
                `Invalida asignacion de area`,
                `Se exedio el limite de asignaciones para el tipo '${type}' en la asignacion de area ${i + 1}`
            );
            break;
        }

        const instanceIndex = validInstances.findIndex( e => e.identifier === identifier);

        if (instanceIndex === -1) {
            r.setError(
                `Invalida asignacion de area`,
                `La instancia '${identifier}' no fue declarada y se usa en la asignacion de area ${i + 1}`
            );
            break;
        }

        if (validInstances[instanceIndex].areas.indexOf(type) !== -1) {
            r.setError(
                `Invalida asignacion de area`,
                `Ya se le asigno el area '${type}' a la instancia '${identifier}'`
            );
            break;
        }

        validAreas[areaIndex].uses += 1;
        validInstances[instanceIndex].areas.push(type);
    }
    if (r.error) return r;

    for (const area of validAreas) {
        if (area.uses === 0) {
            r.setError(
                `Area no asignada`,
                `El area '${area.type}' no fue asignada a ninguna instancia`
            );
            break;
        }
    }
    if (r.error) return r;

    for (const instance of validInstances) {
        if (instance.areas.length === 0) {
            r.setError(
                `Area no asignada`,
                `La instancia '${instance.identifier}' no tiene ningun area asignada`
            );
            break;
        }
    }
    if (r.error) return r;

    
    const items = inits.assign_items;
    
    for(let i = 0; i < items.length; i++) {
        const identifier = items[i].identifier;
        const instanceIndex = validInstances.findIndex( e => e.identifier === identifier);
        if (instanceIndex === -1) {
            r.setError(
                `Invalida asignacion de item`,
                `La instancia '${identifier}' no fue declarada y se usa en la asignacion de item ${i + 1}`
            );
            break;
        };

        const inventory = validInstances[instanceIndex].inventory;

        const value = items[i].value;
        for (const type of items[i].type) {
            if (type !== "flower" && type !== "paper") {
                r.setError(
                    `Invalida asignacion de item`,
                    `El tipo de item '${type}' no es valido y se usa en la asignacion de item ${i + 1}`
                );
                break;
            }
            if (inventory[type]) {
                r.setError(
                    `Invalida asignacion de item`,
                    `Ya se le asigno la cantidad del item '${type}' a la instancia '${identifier}'`
                );
                break;
            }
            inventory[type] = value;
        }
        if (r.error) break;
    }
    if (r.error) return r;
    

    const initials = inits.assign_origins;

    for(let i = 0; i < initials.length; i++) {
        const identifier = initials[i].identifier;
        const origin = {
            x : initials[i].x,
            y : initials[i].y
        }

        const instanceIndex = validInstances.findIndex( e => e.identifier === identifier);

        if (instanceIndex === -1) {
            r.setError(
                `Invalida inicializacion`,
                `Instancia '${identifier}' no fue declarada y se usa en la inicializacion ${i + 1}`
            );
            break;
        }

        if (validInstances[instanceIndex].origin.x) {
            r.setError(
                `Invalida inicializacion`,
                `La instancia '${identifier}' solo puede tener un punto inicial, segundo punto en la inicializacion ${i + 1}`
            );
            break;
        }

        let isValidOrigin = false;

        for (const areaType of validInstances[instanceIndex].areas) {
            const areaIndex = validAreas.findIndex( e => e.type === areaType);
            const area = validAreas[areaIndex];
            if (pointInArea(origin, area.a, area.b)) {
                isValidOrigin = true;
                break;
            }
        }
        if (!isValidOrigin) {
            r.setError(
                `Invalida inicializacion`,
                `Coordenadas iniciales para la instancia '${identifier}' no pertenen a su area en la inicializacion ${i + 1}`
            );
            break;
        }
        
        const originIndex = validInstances.findIndex( e => e.origin.x === origin.x && e.origin.y === origin.y );

        if (originIndex !== -1) {
            r.setError(
                `Invalida inicializacion`,
                `La instancia '${validInstances[originIndex].identifier}' y '${identifier}' tienen el mismo punto inicial`
            );
            break;
        }

        validInstances[instanceIndex].origin = origin;
    }
    if (r.error) return r;

    for (const instance of validInstances) {
        if (!instance.origin.x) {
            r.setError(
                `Invalida inicializacion`,
                `No se asigno un punto inicial para la instancia '${instance.identifier}'`
            );
            break;
        }
    }

    return r;
}


class ExpressionResult {
    constructor() {
        /**
         * @type {boolean}
         */
        this.error = false;
        /**
         * @type {string}}
         */
        this.context = "";
        /**
         * @type {string}
         */
        this.type = null;
    }

    /**
     * @param {string} context 
     */
    setError( context ) {
        this.error = true;
        this.context = context;
    }
    /**
     * Add additional message to the actual context
     * @param {string} additionalContext 
     */
    addContext( additionalContext ) {
        this.context = `${this.context}${additionalContext}`;
    }
    /**
     * Change the existing type with the new
     * @param {string} newType 
     */
    setType( newType ) {
        this.type = newType;
    }
    /**
     * Takes an ExpressionResult to update itself
     * @param {ExpressionResult} newResult 
     */
    update( newResult ) {
        this.error = newResult.error;
        this.context = newResult.context;
        this.type = newResult.type;
    }
}

/**
 * Take an expression tree and an array of variables and validate if value types and identifiers exists
 * @param {expression} exp 
 * @param {variable[]} vars 
 * @returns a {@link ExpressionResult}
 */
const validateExpression = (exp, vars) => {
    const r = new ExpressionResult();
    if (!exp.type) {
        console.log(exp);
        return r;
    }

    const type = exp.type;

    if ( type === "BINARY_OPERATION" ) {
        const rLeft = validateExpression(exp.lhs, vars);
        if (rLeft.error) return rLeft;

        const rRight = validateExpression(exp.rhs, vars);
        if (rRight.error) return rRight;

        const op = exp.operator;
        if ( op === "+" || op === "-" || op === "*" || op === "/" || op === ">" || op === ">=" || op === "<" || op === "<=" ) {
            if (rLeft.type !== "numero") {
                r.setError(`Para utilizar el operador ${op} el termino izquierdo debe ser del tipo numero`);
                return r;
            }
            if (rRight.type !== "numero") {
                r.setError(`Para utilizar el operador ${op} el termino derecho debe ser del tipo numero`);
                return r;
            }

            if ( op === "+" || op === "-" || op === "*" || op === "/" ) {
                r.setType("numero");
            }
            else {
                r.setType("boolean");
            }

            return r;
        }
        if ( op === "&" || op === "|" ) {
            if (rLeft.type !== "boolean") {
                r.setError(`Para utilizar el operador ${op} el termino izquierdo debe ser del tipo boolean`);
                return r;
            }
            if (rRight.type !== "boolean") {
                r.setError(`Para utilizar el operador ${op} el termino derecho debe ser del tipo boolean`);
                return r;
            }

            r.setType("boolean");
            return r;
        }

        if (op === "=" || op === "!=") {
            if (rLeft.type !== rRight.type) {
                r.setError(`Para utilizar el operador ${op} el termino izquierdo debe ser del mismo tipo que el de la derecha`);
                return r;
            }

            r.setType("boolean");
            return r;
        }
    }
    
    if ( type === "UNARY_OPERATION" ) {
        const op = exp.operator;
        const rRight = validateExpression(exp.rhs, vars);
        if (rRight.error) return rRight;

        if (op === "-") {
            if (rRight.type !== "numero") {
                r.setError("No se puede hacer negativo un valor booleano, mal uso del operador '-'");
                return r;
            }
            r.setType("numero");
        }
        if (op === "~") {
            if (rRight.type !== "boolean") {
                r.setError("No se puede negar un valor numero, mal uso del operador '!'");
                return r;
            }
            r.setType("boolean");
        }
        return r;
    }

    if ( type === "LITERAL_INTEGER") {
        r.setType("numero");
        return r;
    }
    if ( type === "LITERAL_BOOLEAN") {
        r.setType("boolean");
        return r;
    }

    if ( type === "VARIABLE" ) {
        const varIndex = vars.findIndex(v => v.identifier === exp.identifier);
        if (varIndex === -1) {
            r.setError(
                `Variable invalida, '${exp.identifier}' no fue declarada`
            );
            return r;
        };

        r.setType(vars[varIndex].type_value);
        return r;
    }

    if ( type === "STATE_METHOD" ) {
        const id = exp.identifier;

        if ( id === "HayFlorEnLaEsquina" ||
             id === "HayPapelEnLaEsquina" ||
             id === "HayFlorEnLaBolsa" ||
             id === "HayPapelEnLaBolsa") {
            r.setType("boolean");
            return r;
        }

        if ( id === "PosCa" || id === "PosAv" ) {
            r.setType("numero");
            return r;
        }

        console.log("no resolviste esto pa", exp);
    }

    console.log(exp, "no resolviste este caso pa");
}

/**
 * 
 * @param {statement} statement 
 * @param {variable[]} vars 
 * @param {string[]} instancesIds 
 * @param {validProcedure[]} validProcedures 
 * @returns a {@link ValidationResult}
 */
const validateStatement = (statement, vars, instancesIds, validProcedures) => {
    const r = new ValidationResult();
    if (!statement.type) {
        console.log(statement);
        return r;
    }

    const type = statement.type;

    if ( type === "STATEMENT_ASSIGN" ) {
        const identifier = statement.identifier;
        const varIndex = vars.findIndex(v => v.identifier === identifier);
        if (varIndex === -1) {
            r.setError(
                "Invalida asignacion de valor",
                `Variable invalida, '${identifier}' no fue declarada`
            );
            return r;
        };

        const varType = vars[varIndex].type_value;
        
        const value = statement.value;
        const rExp = validateExpression(value, vars);
        if (rExp.error) {
            r.setError(
                "Invalida asignacion de valor",
                `${rExp.context}, en la asignacion de la variable ${identifier}`,
            );
            return r;
        }

        if (varType !== rExp.type) {
            r.setError(
                "Invalida asignacion de valor",
                `No se puede asignar un valor de tipo ${rExp.type} a una variable de tipo ${varType}, en la asignacion de la variable ${identifier}`,
            )
        }

        return r;
    }

    if ( type === "STATEMENT_BLOCK" ) {
        const resultBody = validateBody(statement.body, vars, instancesIds, validProcedures);
        if (resultBody.error) {
            r.setError(
                resultBody.type,
                resultBody.context,
            )
        }
        return r;
    }

    if ( type === "IF" || type === "FOR" || type === "WHILE" ) {
        const condition = statement.condition;
        const rCond = validateExpression(condition, vars);
        if (rCond.error) {
            r.setError(
                "Condicion invalida",
                `${rCond.context}, en declaracion de condicion`,
            )
            return r;
        }

        if ( type === "IF" || type === "WHILE" ) {
            if (rCond.type !== "boolean") {
                r.setError(
                    "Invalido resultado de condicion",
                    `Resultado de expresion invalido, una condicion en una sentencia de tipo ${type === "IF"? "si":"mientras"} debe ser de tipo booleana una vez evaluada`,
                )
                return r;
            }
        }
        else if ( type === "FOR" ) {
            if (rCond.type !== "numero") {
                r.setError(
                    "Invalido resultado de condicion",
                    `Resultado de expresion invalido, una condicion en una sentencia de tipo repetir debe ser de tipo numero una vez evaluada`,
                )
                return r;
            }
        }

        const rBody = validateStatement(statement.body, vars, instancesIds, validProcedures);
        if (rBody.error) {
            r.setError(
                rBody.type,
                rBody.context,
            )
            return r;
        }

        if (type === "IF") {
            const rElse = validateStatement(statement.body, vars, instancesIds, validProcedures)
            if (rElse.error) {
                r.setError(
                    rElse.type,
                    `${rElse.context}, en la declaracion del sino`,
                )
            }
        }

        return r;
    }

    // Improve the handling of arguments at inform sentence
    if ( type === "INFORM" ) {
        const { arg1, arg2 } = statement;
        let rExp = new ValidationResult();

        if (arg1.type === "STRING_LITERAL" && arg2.type) {
            rExp = validateExpression(arg2, vars);
        }
        else if (arg1.type !== "STRING_LITERAL") {
            rExp = validateExpression(arg1, vars);
        }
        if (rExp.error) {
            r.setError(
                `Invalida declaracion de parametro`,
                `${rExp.context}, en la declaracion del parametro para el Informar`
            )
        }

        return r;
    }

    if ( type === "CHANGE_POSITION" ) {
        const { x, y } = statement;

        const rExpX = validateExpression(x, vars);
        if (rExpX.error) {
            r.setError(
                `Invalida declaracion de parametro`,
                `${rExpX.context}, en la coordenada x del Pos`
            )
            return r;
        }
        if (rExpX.type !== "numero") {
            r.setError(
                "Invalida declaracion de parametro",
                `Resultado de expresion invalido, la expresion para el parametro x del Pos debe dar como resultado un valor de tipo numero`,
            )
            return r;
        }

        const rExpY = validateExpression(y, vars);
        if (rExpY.error) {
            r.setError(
                `Invalida declaracion de parametro`,
                `${rExpY.context}, en la coordenada y del Pos`
            )
            return r;
        }
        if (rExpY.type !== "numero") {
            r.setError(
                "Invalida declaracion de parametro",
                `Resultado de expresion invalido, la expresion para el parametro y del Pos debe dar como resultado un valor de tipo numero`,
            )
            return r;
        }

        return r;
    }

    if ( type === "MESSAGE" ) {
        const { value, who, mode } = statement;

        const rValue = validateExpression(value, vars);
        if (rValue.error) {
            r.setError(
                `Invalida declaracion de parametro`,
                `${rValue.context}, en el parametro de valor del ${mode === "SEND"? "Enviar" : "Recibir"}Mensaje`
            )
            return r;
        }

        instancesIds.push("*");
        const resultWho = identifierExist(who, instancesIds);
        if (!resultWho) {
            r.setError(
                `Invalida declaracion de parametro`,
                `Instancia '${who}' no fue declarada y se usa en el parametro de instancia del Mensaje`
            )
        }

        return r;
    }

    if ( type === "CONTROL_CORNER" ) {
        const { x, y, mode } = statement;

        const rExpX = validateExpression(x, vars);
        if (rExpX.error) {
            r.setError(
                `Invalida declaracion de parametro`,
                `${rExpX.context}, en la coordenada x del ${mode === "BLOCK"? "Bloquear" : "Liberar"}Esquina`
            )
            return r;
        }
        if (rExpX.type !== "numero") {
            r.setError(
                "Invalida declaracion de parametro",
                `Resultado de expresion invalido, la expresion para el parametro x del ${mode === "BLOCK"? "Bloquear" : "Liberar"}Esquina debe dar como resultado un valor de tipo numero`,
            )
            return r;
        }

        const rExpY = validateExpression(y, vars);
        if (rExpY.error) {
            r.setError(
                `Invalida declaracion de parametro`,
                `${rExpX.context}, en la coordenada y del ${mode === "BLOCK"? "Bloquear" : "Liberar"}Esquina`
            )
            return r;
        }
        if (rExpY.type !== "numero") {
            r.setError(
                "Invalida declaracion de parametro",
                `Resultado de expresion invalido, la expresion para el parametro y del ${mode === "BLOCK"? "Bloquear" : "Liberar"}Esquina debe dar como resultado un valor de tipo numero`,
            )
            return r;
        }

        return r;
    }

    if ( type === "CALL_PROCEDURE" ) {
        const { identifier, parameters } = statement;

        const validProceduresIds = getIdentifiers(validProcedures);

        const identifierIndex = validProceduresIds.indexOf(identifier);
        if (identifierIndex === -1) {
            r.setError(
                `Invalido llamado de proceso`,
                `El proceso '${identifier}' no fue declarado`
            )
            return r;
        }

        const formalParameters = validProcedures[identifierIndex].parameters;
        const actualParameters = parameters;

        if (formalParameters.length > actualParameters.length) {
            r.setError(
                `Invalido llamado de proceso`,
                `Menos parametros en la llamada del proceso que los correspondientes para el proceso '${identifier}'`
            )
            return r;
        }
        else if (formalParameters.length < actualParameters.length) {
            r.setError(
                `Invalido llamado de proceso`,
                `Mas parametros en la llamada del proceso que los correspondientes para el proceso '${identifier}'`
            );
            return r;
        }
        
        if (formalParameters.length === 0) return r;

        for (let i = 0; i < formalParameters.length; i++) {
            if (formalParameters[i].type_parameter === "ES") {
                if (actualParameters[i].type !== "VARIABLE"){
                    r.setError(
                        `Invalido llamado de proceso`,
                        `Parametro ${i + 1} en la llamada del proceso '${identifier}' debe ser una variable ya que la posicion corresponde a uno parametro ES`
                    )
                    break;
                }
                const varIndex = vars.findIndex(v => v.identifier === actualParameters[i].identifier);
                if (varIndex === -1) {
                    r.setError(
                        `Invalido llamado de proceso`,
                        `Variable '${actualParameters[i].identifier}' no fue declarada y se usa en el llamado del proceso '${identifier}'`
                    );
                    return r;
                };
                if (vars[varIndex].type_value !== formalParameters[i].type_value) {
                    r.setError(
                        `Invalido llamado de proceso`,
                        `Parametro ${i + 1} en la llamada del proceso '${identifier}' no es del mismo tipo que el parametro ${i + 1} en la declaracion del proceso`,
                    );
                    return r;
                }
            }
            else {
                const rExp = validateExpression(actualParameters[i], vars);
                if (rExp.error) {
                    r.setError(
                        `Invalido llamado de proceso`,
                        `${rExp.context}, en la declaracion del paramtro ${i + 1} en el llamado del proceso '${identifier}'`
                    );
                    return r;
                }
                if (rExp.type !== formalParameters[i].type_value) {
                    r.setError(
                        `Invalido llamado de proceso`,
                        `Parametro ${i + 1} en la llamada del proceso '${identifier}' no es del mismo tipo que el parametro ${i + 1} en la declaracion del proceso`,
                    );
                    return r;
                }
            }
        }

        return r;
    }

    return r;
}

/**
 * 
 * @param {statement[]} body 
 * @param {variable[]} vars 
 * @param {string[]} instancesIds 
 * @param {validProcedure[]} validProcedures 
 * @returns a {@link ValidationResult}
 */
const validateBody = (body, vars, instancesIds, validProcedures) => {
    const r = new ValidationResult();

    if (body.length === 0) return r;

    for(let i = 0; i < body.length; i++) {
        const statement = body[i];
        const statementResult = validateStatement(statement, vars, instancesIds, validProcedures);
        
        if (statementResult.error) {
            r.setError(
                statementResult.type,
                statementResult.context
            )
            break;
        }
    }

    return r;
}

/**
 * 
 * @param {procedure[]} procedures 
 * @param {string[]} instancesIds 
 * @returns a {@link ValidationResult}
 */
const validateProcedures = (procedures, instancesIds) => {
    const r = new ValidationResult();

    if (procedures.length === 0) return r;

    const validProcedures = getValidProcedures(procedures);

    /**
     * @type {string[]}
     */
    const validProceduresIds = [];
    for(let i = 0; i < procedures.length; i++) {
        const procedureId = procedures[i].identifier;

        const indexIdExist = validProceduresIds.indexOf(procedureId)
        if (indexIdExist !== -1) {
            r.setError(
                `Invalida declaracion de proceso`,
                `Identificador '${procedureId}' se usa en la declaracion del proceso ${indexIdExist + 1} y ${i + 1}`
            )
            break;
        }

        const resultPar = identifiersAreUnique(procedures[i].parameters);
        if (resultPar.error) {
            r.setError(
                `Invalida declaracion de parametro`,
                `${resultPar.errorContext}, en la declaracion del proceso '${procedureId}'`
            )
            break;
        }

        const resultVar = identifiersAreUnique(procedures[i].local_variables);
        if (resultVar.error) {
            r.setError(
                `Invalida declaracion de variable`,
                `${resultVar.errorContext}, en la declaracion del proceso '${procedureId}'`
            )
            break;
        }

        const allVars = procedures[i].local_variables.concat(getVariables(procedures[i].parameters));
        
        const body = procedures[i].body;
        const resultBody = validateBody(body, allVars, instancesIds, validProcedures);

        if (resultBody.error) {
            r.setError(
                `${resultBody.type}`,
                `${resultBody.context}, en la declaracion del proceso '${procedureId}'`
            )
            break;
        }

        validProceduresIds.push(procedureId);
    }

    return r;
}

/**
 * 
 * @param {robot[]} robot_types 
 * @param {procedure[]} procedures 
 * @param {string[]} instancesIds 
 * @returns a {@link ValidationResult}
 */
const validateRobotTypes = (robot_types, procedures, instancesIds) => {
    const r = new ValidationResult();

    const validProcedures = getValidProcedures(procedures);

    /**
     * @type {string[]}
     */
    const validRobotTypeIds = [];
    for(let i = 0; i < robot_types.length; i++) {
        const robotTypeId = robot_types[i].identifier;

        const indexIdExist = validRobotTypeIds.indexOf(robotTypeId)
        if (indexIdExist !== -1) {
            r.setError(
                `Invalida declaracion de tipo de robot`,
                `Identificador '${robotTypeId}' se usa en la declaracion de tipo de robot ${indexIdExist + 1} y ${i + 1}`
            )
            break;
        }

        const resultVar = identifiersAreUnique(robot_types[i].local_variables);
        if (resultVar.error) {
            r.setError(
                `Invalida declaracion de variable`,
                `${resultVar.errorContext}, en la declaracion del tipo de robot '${robotTypeId}'`
            )
            break;
        }

        const allVars = robot_types[i].local_variables;
        
        const body = robot_types[i].body;
        const resultBody = validateBody(body, allVars, instancesIds, validProcedures);

        if (resultBody.error) {
            r.setError(
                `${resultBody.type}`,
                `${resultBody.context}, en la declaracion del tipo de robot '${robotTypeId}'`
            )
            break;
        }

        validRobotTypeIds.push(robotTypeId);
    }

    return r;
}

/**
 * Take a RobotScript ast an validate it returning the succes or failure ( with a message atacched that describe it ) of the validation
 * @param {RSast} inputAst {@link RSast}
 * @returns a {@link ValidationResult}
 */
function validateAst(inputAst) {
    const { PROCEDURES, AREAS, ROBOT_TYPES, INSTANCES, INITS } = inputAst;

    const result = new ValidationResult();

    result.update(validateAreas(AREAS));

    if (result.error) return result;


    result.update(validateInstances(INSTANCES, ROBOT_TYPES));

    if (result.error) return result;

    result.update(validateInits(INITS, INSTANCES, AREAS));

    if (result.error) return result;

    const instancesIds = getIdentifiers(INSTANCES);
    result.update(validateProcedures(PROCEDURES, instancesIds));
    
    if (result.error) return result;

    result.update(validateRobotTypes(ROBOT_TYPES, PROCEDURES, instancesIds));

    return result;
};

export {validateAst}
