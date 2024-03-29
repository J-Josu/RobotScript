"use strict";

import Manager from "../general/Manager.js";
import { toAst } from "./ast-generator.js";
import { validateAst } from "./ast-validator.js";

const DEFAULT_EDITOR_CODE =  `programa //nombre

areas
  //nombre: tipo(x1,y1,x2,y2)

robots
  robot //nombre
  variables
    // nombre: tipo
  comenzar
    //instrucciones
  fin

variables
  //nombre: tipo

comenzar
  //AsignarArea(nombre, tipo)
  //Iniciar(nombre, x, y)
fin`;
const CUSTOM_COMPLETES = [
    { word : "programa", meta : "define nombre del programa",},
    { word : "procesos", meta : "seccion",},
    { word : "areas", meta : "seccion",},
    { word : "robots", meta : "seccion",},
    { word : "proceso", meta : "declaracion proceso",},
    { word : "robot", meta : "declaracion robot",},
    { word : "variables", meta : "seccion",},
    { word : "comenzar", meta : "inicio bloque de codigo",},
    { word : "fin", meta : "final bloque de codigo",},
    { word : "si", meta : "sentencia control",},
    { word : "sino", meta : "sentencia control",},
    { word : "mientras", meta : "sentencia control",},
    { word : "repetir", meta : "sentencia control",},
    { word : "HayFlorEnLaEsquina", meta : "consulta estado",},
    { word : "HayPapelEnLaEsquina", meta : "consulta estado",},
    { word : "HayFlorEnLaBolsa", meta : "consulta estado",},
    { word : "HayPapelEnLaBolsa", meta : "consulta estado",},
    { word : "PosCa", meta : "consulta estado",},
    { word : "PosAv", meta : "consulta estado",},
    { word : "verdad", meta : "valor de veracidad",},
    { word : "falso", meta : "valor de falsedad",},
    { word : "boolean", meta : "tipo de variable",},
    { word : "numero", meta : "tipo de variable",},
    { word : "AreaC", meta : "tipo de area",},
    { word : "AreaP", meta : "tipo de area",},
    { word : "AreaPC", meta : "tipo de area",},
    { word : "Pos", meta : "accion",},
    { word : "mover", meta : "accion",},
    { word : "derecha", meta : "accion",},
    { word : "tomarFlor", meta : "accion",},
    { word : "tomarPapel", meta : "accion",},
    { word : "depositarFlor", meta : "accion",},
    { word : "depositarPapel", meta : "accion",},
    { word : "Informar", meta : "accion",},
    { word : "Random", meta : "asignacion",},
    { word : "AsignarArea", meta : "asignacion",},
    { word : "Iniciar", meta : "asignacion",},
    { word : "EnviarMensaje", meta : "comunicacion",},
    { word : "RecibirMensaje", meta : "comunicacion",},
    { word : "BloquearEsquina", meta : "comunicacion",},
    { word : "LiberarEsquina", meta : "comunicacion",},
];

class EditorManager extends Manager {
    constructor(config) {
        super({
            ...config,
            defaultName : "Editor"
        });

        this.toolBar = {
            upload : this.container.querySelector(".btnUpload"),
            download : this.container.querySelector(".btnDownload"),
            copy : this.container.querySelector(".btnCopy"),
            clear : this.container.querySelector(".btnClear"),
            fontSize : this.container.querySelector(".tool-fontSize"),
            compile : this.container.querySelector(".btnCompile"),
        }
        this.toolBar.fontSize.value = this.storage.getLocalValue("editor-fontsize",16);

        this.aceEditor = ace.edit(this.window);

        this.cursorPosition = this.stateBar.container.querySelector(".cursor-position");
        
        this.programCode = this.storage.getLocalValue("programCode", "");

        this.initAce = () => {
            //Configure editor
            this.aceEditor.setOptions({
                autoScrollEditorIntoView: true,
                copyWithEmptySelection: true,
            });
    
            //Configure renderer
            this.aceEditor.renderer.setOptions({
                highlightGutterLine : true,
                showPrintMargin: false,
                displayIndentGuides : true,
                fontFamily : "monospace",
                fontSize : `${this.storage.getLocalValue("editor-fontsize",16)}px`,
                scrollPastEnd : 1,
                theme : "ace/theme/darkplus",
            });
    
            //Configure session
            this.aceEditor.session.setOptions({
                useSoftTabs : true,
                tabSize : 2,
                mode : "ace/mode/robotscript",
            });
    
            //Configure extensions
            this.aceEditor.setOptions({
                enableBasicAutocompletion : true,
                enableLiveAutocompletion : true,
            });
            //Set custom autocomplete
            const RSWordCompleter = {
                getCompletions: function(editor, session, pos, prefix, callback) {
                    callback(null, CUSTOM_COMPLETES.map(function(c) {
                        if (!c.word.match(new RegExp(prefix, "i"))) return {};
                        return {
                            caption: c.word,
                            value: c.value? c.value : c.word,
                            meta: c.meta
                        };
                    }));
                }
            }
            this.aceEditor.completers = [RSWordCompleter];
    
            //Set initial text
            if (this.programCode === "") {
                this.aceEditor.setValue(DEFAULT_EDITOR_CODE);
                this.programCode = DEFAULT_EDITOR_CODE;
            }
            else {
                this.aceEditor.setValue(this.programCode);
            }
    
            //Handling some ace events
            this.aceEditor.selection.on("changeCursor", () => {
                const { row, column } = this.aceEditor.session.selection.getCursor();
            
                if (this.cursorPosition) {
                    this.cursorPosition.innerText= `Ln ${row + 1}, Col ${column + 1}`;
                };
            });
            
            this.aceEditor.on("change", () => {
                this.programCode = this.aceEditor.getValue();
                this.storage.setLocalValue("programCode", this.programCode);
            });
        }

        this.initToolBar = () => {
            this.toolBar.upload.addEventListener("click", () => {
                const fileInput = document.createElement("input");
                fileInput.type = 'file';
                fileInput.accept = '.rs';
                fileInput.style.display = 'none';
                fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if ( !file ) return;
                    const type = file.name.split(".")[1];
                    if ( !type || (type !== "rs" && type !== "txt" && type !== "ri")) return;
                    const editor = this.aceEditor;
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const contents = e.target.result;
                        editor.setValue(contents);
                        document.body.removeChild(fileInput);
                    };
                    reader.readAsText(file);
                }
                document.body.appendChild(fileInput);
                fileInput.click();
            });

            this.toolBar.download.addEventListener("click", () => {
                const downloadFileToUser = (filename, content) => {
                    let element = document.createElement('a');
                    element.style.display = 'none';
                
                    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
                
                    element.setAttribute('download',filename);
                    document.body.appendChild(element);
                
                    element.click();
                    this.console.set([
                        {  
                            state: "info",
                            message : "Programa descargado con exito"
                        }
                    ]);
                
                    document.body.removeChild(element);
                };
                const textToDownload = this.aceEditor?.getValue()
                const i = textToDownload?.indexOf('programa');
            
                if (!textToDownload || i === -1) {
                    this.console.set([
                        {  
                            state: "error",
                            message : "No se encuentra la seccion programa"
                        }
                    ]);
                    return;
                };
            
                let j = textToDownload.indexOf('\n',i);
                if ( j == -1 ) j = textToDownload.length;
                const fileName = textToDownload.substring(i,j).replace('programa','').trimStart();
                if (fileName === "") {
                    this.console.set([
                        {  
                            state: "error",
                            message : "No existe nombre de programa"
                        }
                    ]);
                    return;
                }
                
                downloadFileToUser( `${fileName}.rs`, textToDownload )
            });

            this.toolBar.copy.addEventListener("click", () => {
                if ( this.aceEditor && navigator.clipboard ) {
                    const textToCopy = this.aceEditor.getValue();
                    navigator.clipboard.writeText( textToCopy );
                    this.console.add([
                        {  state : "info", message : "Codigo copiado al portapapeles" }
                    ]);
                }
            });

            this.toolBar.clear.addEventListener("click", () => {
                if ( this.aceEditor ) {
                    this.aceEditor.setValue("");
                    this.console.set([
                        {  state : "info", message : "Codigo borrado" }
                    ]);
                };
            });
            
            this.toolBar.fontSize.addEventListener("change", () => {
                if ( this.aceEditor ) {
                    const newFontSize = this.toolBar.fontSize.value;
                    this.aceEditor.setOption('fontSize', `${newFontSize}px`);
                    this.storage.setLocalValue("editor-fontsize", newFontSize);
                    this.console.add([
                        { state : "info", message : `Tamaño de fuente cambiado a ${newFontSize}px` }
                    ]);
                };
            });

            this.toolBar.compile.addEventListener("click", () => {
                if (this.programCode.length === 0) {
                    this.console.add([
                        { state : "error", message : "No hay programa el cual compilar" }
                    ]);
                    this.storage.loadProgram(null);
                    return;
                }

                const astResult = toAst(this.programCode);

                if (astResult.error) {
                    let errorLog = "";
                    if (astResult.error === "lexer") {
                        astResult.errors.forEach( e => errorLog += `${e.message}\n`);
                    } else {
                        astResult.errors.forEach( e => errorLog += `${e.message}\n`);
                    }
                    this.console.add([
                        { emitter : "Compilador", state : "error", message : errorLog }
                    ]);
                    this.storage.loadProgram(null);
                    return;
                }

                const ast = astResult.ast;
                const validation = validateAst(ast.value);

                if (validation.error) {
                    const errorLog = validation.context;
                    this.console.add([
                        { emitter : "Compilador", state : "error", message : errorLog }
                    ]);
                    this.storage.loadProgram(null);
                    return;
                }

                this.storage.loadProgram(ast.value);
                this.console.set([
                    { state : "valid", message : "Compilado con exito, listo para ejecucion" }
                ]);
            });

        }

        this.initAce();
        this.initToolBar();
    }
}

export default EditorManager;