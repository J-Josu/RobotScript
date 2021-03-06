"use strict";

class CameraHandler {
    constructor(city) {
        this.city = city;
        this.container = city.element;
        this.canvas = city.canvas;
        this.storage = city.storage;
        this.size = {
            width : this.storage.camera.width,
            height : this.storage.camera.height
        }
        this.scale = 1;
        this.change = 0.2;
        this.scaleDif = {
            x : 0,
            y : 0,
        }
        this.offset = {
            x : this.size.width / 2 - 16,
            y :  this.size.height / 2 - 1624 + 24
        }
        this.canvas.width = 1624;
        this.canvas.height = 1624;
        
        this.container.addEventListener("wheel", e => this.update(e), { passive: true });
        this.container.addEventListener("mousedown", e => this.startDrag(e), true);

        this.onMouseUp = () => {
            this.isMouseDown = false;
            this.container.removeEventListener("mousemove", this.onMouseMove);
            this.container.removeEventListener("mouseup", this.onMouseUp);
            this.container.removeEventListener("mouseleave", this.onMouseUp);
        }
    
        this.onMouseMove = ({ movementX, movementY }) => {
            if (this.isMouseDown) { 
                this.offset.x += (movementX/this.scale);
                this.offset.y += (movementY/this.scale);
                
                this.canvas.style.transform = `translate(${ - this.scaleDif.x + this.offset.x }px,${ - this.scaleDif.y + this.offset.y }px)`;
            }
        }

        //touch events
        this.touch = {
            x : 0,
            y : 0,
            distance : 0
        };

        this.container.addEventListener("touchstart", e => this.startTouch(e), { passive: false });
        this.container.addEventListener("touchend", e => this.onTouchEnd(e), { passive: false });
        this.container.addEventListener("touchcancel", e => this.onTouchCancel(e), { passive: false });
        this.container.addEventListener("touchmove", e => this.onTouchMove(e), { passive: false });

        this.startTouch = (ev) => {
            ev.preventDefault();
            this.isTouchDown = true;

            if (ev.touches.length === 1) {
                this.touch.x = ev.touches[0].pageX;
                this.touch.y = ev.touches[0].pageY;
            }
            else if (ev.touches.length === 2) {
                this.touch.x = (ev.touches[0].pageX + ev.touches[1].pageX) / 2;
                this.touch.y = (ev.touches[0].pageY + ev.touches[1].pageY) / 2;
                this.touch.distance = this.distance(ev);
            }
        }

        this.onTouchEnd = (e) => {
            e.preventDefault();
            this.isTouchDown = false;
        }
        this.onTouchCancel = (e) => {
            e.preventDefault();
             this.isTouchDown = false;
        }

        this.onTouchMove = (ev) => {
            ev.preventDefault();
            
            if (this.isTouchDown) {
                if (ev.touches.length === 1) {  
                    const t = ev.changedTouches[0];
                    const x = t.pageX;
                    const y = t.pageY;
    
                    const moveX = this.touch.x - x;
                    const moveY = this.touch.y - y;
                    this.offset.x -= (moveX/this.scale);
                    this.offset.y -= (moveY/this.scale);
                    
                    this.updateCanvasTranslate();
    
                    this.touch.x = x;
                    this.touch.y = y;
                }
                else if (ev.touches.length === 2) {
                    const deltaDistance = this.distance(ev);
                    const difference = deltaDistance - this.touch.distance;

                    if (difference === 0) return;
                    if (this.scale < 0.3 && difference < 0) return;
                    if (this.scale > 4 && difference > 0) return;

                    if (difference > 0)
                        this.scale += 0.05;
                    else
                        this.scale -= 0.05;
                    
                    const newWidth = this.size.width / this.scale;
                    const newHeight = this.size.height / this.scale;
            
                    this.scaleDif.x = -(newWidth - this.size.width)/2;
                    this.scaleDif.y = -(newHeight - this.size.height)/2;
            
                    this.storage.camera.scale = this.scale;
            
                    this.updateContainerTransform(newWidth, newHeight);

                    this.touch.distance = deltaDistance;
                }
            }
        }
        
        this.updateCanvasTranslate();
    }

    update(event) {
        if (this.scale < 0.3 && event.deltaY > 0) return;
        if (this.scale > 4 && event.deltaY < 0) return;

        if (event.deltaY > 0)
            this.scale -= this.change;
        else
            this.scale += this.change;
        
        const newWidth = this.size.width / this.scale;
        const newHeight = this.size.height / this.scale;

        this.scaleDif.x = -(newWidth - this.size.width)/2;
        this.scaleDif.y = -(newHeight - this.size.height)/2;

        this.storage.camera.scale = this.scale;

        this.updateContainerTransform(newWidth, newHeight);
    }

    startDrag() {
        this.isMouseDown = true;
        this.container.addEventListener("mousemove", this.onMouseMove);
        this.container.addEventListener("mouseup", this.onMouseUp);
        this.container.addEventListener("mouseleave", this.onMouseUp);
    }

    updateContainerTransform(newWidth, newHeight) {
        this.container.style.width = `${newWidth}px`;
        this.container.style.height = `${newHeight}px`;
        this.container.style.transform = `translate(${ this.scaleDif.x}px,${this.scaleDif.y}px) scale(${this.scale})`;

        this.updateCanvasTranslate();
    }
    updateCanvasTranslate() {
        this.canvas.style.transform = `translate(${ - this.scaleDif.x + this.offset.x }px,${ - this.scaleDif.y + this.offset.y }px)`;
    }

    //utilities
    distance(event) {
        return Math.hypot(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY - event.touches[1].pageY);
    };
}

export default CameraHandler;