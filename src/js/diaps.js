const Diaps = function (selector, onStart) {
    const Layer = function (node, layerClass) {
        const layerElement = document.createElement('div');
        layerElement.classList.add('diaps__layer', `diaps__layer--${layerClass}`);
        node.appendChild(layerElement);

        const container = {};
        container.media = Container(layerElement, 'media');
        container.text = Container(layerElement, 'text');

        return {container};
    };

    const Container = function (layerNode, containerName) {
        const contentList = [];

        const add = function (node, animation, onStart) {
            const content = document.createElement('div');
            content.appendChild(node);
            content.classList.add('diaps__content');
            layerNode.appendChild(content);

            return function addContent() {
                onStart(node);
                contentList.push(content);
                if (!animation || _isQuiet) {
                    return true;
                }
                content.classList.add('animated', animation);
                content.addEventListener('animationend', () => {
                    content.classList.remove(animation);
                });
            }
        };
		
		const querying = function(query) {
			if (query && query.tagName) {
				return query;
			}
			if (query === 'first') {
			  return contentList[0];
			}
			 
			return contentList[contentList.length - 1];
		}

        const animate = function (query, animation = false, onEnd = false) {
            const content = querying(query);

            return function animateContent() {
                if (!content) {
                    return true;
                }

                if (!animation || _isQuiet) {
                    if (onEnd) {
                        onEnd(content);
                    }
                    return true;
                }

                content.classList.add('animated', animation);
                if (onEnd) {
                    window.requestAnimationFrame(() => {
                        content.addEventListener('animationend', () => {
                            onEnd(content);
                        });
                    });
                }
            };
        };

        const remove = function (query, animation = false) {
			
            return function removeContent() {
				const content = querying(query);
                if (!content) {
					console.error('Impossible to remove "' + query + '" ' + containerName + ' with "' + animation + '" animation');
                    return true;
                }
				
				contentList.splice(contentList.indexOf(content), 1);
				animate(content, animation, () => {
					content.parentNode.removeChild(content);
				})();
			}
        };

        return {add, animate, remove};
    };

    const NewContent = function (node, type = false, onStart = false) {
        const add = function (layer, animation = false) {
            const container = layer.container[type];
            return container.add(node, animation, onStart);
        };

        const slideInUp = function (layer) {
            return add(layer, 'slideInUp');
        };
        const slideInRight = function (layer) {
            return add(layer, 'slideInRight');
        };
        const slideInLeft = function (layer) {
            return add(layer, 'slideInLeft');
        };
        const slideInDown = function (layer) {
            return add(layer, 'slideInDown');
        };
        const bounceIn = function (layer) {
            return add(layer, 'bounceIn');
        };
        const fadeIn = function (layer) {
            return add(layer, 'fadeIn');
        };
        const zoomIn = function (layer) {
            return add(layer, 'zoomIn');
        };

        return {to: add, slideInUp, slideInLeft, slideInRight, slideInDown, bounceIn, fadeIn, zoomIn};
    };

    const ExistingContent = function (container, query = 'last') {
        const remove = function (animation = false) {
            return container.remove(query, animation);
        };
        const animate = function (animation) {
            return container.animate(query, animation);
        };

        const slideOutUp = function () {
            return remove('slideOutUp');
        };
        const slideOutRight = function () {
            return remove('slideOutRight');
        };
        const slideOutLeft = function () {
            return remove('slideOutLeft');
        };
        const slideOutDown = function () {
            return remove('slideOutDown');
        };
        const bounce = function () {
            return animate('bounce')
        };
        const bounceOut = function () {
            return remove('bounceOut');
        };
        const fadeOut = function () {
            return remove('fadeOut');
        };

        return {remove, slideOutUp, slideOutLeft, slideOutRight, slideOutDown, bounce, bounceOut, fadeOut};
    };

    const Image = {};
    Image.add = function (src, ...extraClasses) {
        const img = document.createElement('img');
        img.classList.add('diaps__media', ...extraClasses);
        img.src = src;
        img.style.opacity = 0;

        return NewContent(img, 'media', () => {
            img.style.opacity = 1;
        });
    };
    Image.from = function (layer) {
        return ExistingContent(layer.container.media);
    };
    Image.first = function (layer) {
        return ExistingContent(layer.container.media, query = 'first');
    };

    const Video = {};
    Video.add = function (src, ...extraClasses) {
        const video = document.createElement('video');
        video.classList.add('diaps__media', ...extraClasses);
        video.src = src;
        video.style.opacity = 0;

        return NewContent(video, 'media', () => {
            video.style.opacity = 1;
            video.play();
        });
    };
    Video.from = function (layer) {
        return ExistingContent(layer.container.media);
    };
    Video.first = function (layer) {
        return ExistingContent(layer.container.media, query = 'first');
    };

    const Text = {};
    Text.add = function add(text, ...extraClasses) {
        const div = document.createElement('div');
        div.classList.add('diaps__text', ...extraClasses);

        return NewContent(div, 'text', () => {
            div.innerHTML = text;
        });
    };
    Text.from = function from(layer) {
        return ExistingContent(layer.container.text);
    };
    Text.first = function (layer) {
        return ExistingContent(layer.container.media, query = 'first');
    };

    const Sound = {};
	Sound.current;
    Sound.add = function add(src) {
        return function addSound() {
            if (!_isQuiet) {
                Sound.current = new Audio(src);
                Sound.current.play();
            }
        }
    };

    const initialize = function () {
        const startButton = node.querySelector('.diaps__start');
        const timer = Timer('.diaps__timer');
        let chain = TimeChain();
        onStart(chain.wait(1), controls).exec(timer.stop);

        if (window.location.hash) {
            const hash = parseInt(window.location.hash.slice(1));
            if (!isNaN(hash)) {
                setIsQuiet(true);
                chain = chain.fastForward(hash);
                setIsQuiet(false);
                timer.set(hash);

                if (!chain) {
                    startButton.parentNode.removeChild(startButton);
                }
            }
        }

        startButton.addEventListener('animationend', () => {
            if (chain.isActive()) {
                startButton.style.display = 'none';
            }
        });
        chain.onStart(function () {
            timer.start();
			Sound.current && Sound.current.play();
            startButton.classList.remove('zoomIn');
            startButton.classList.add('animated', 'zoomOut');
        });

        chain.onPause(function () {
            timer.stop();
			Sound.current && Sound.current.pause();
            startButton.style.display = 'block';
            window.requestAnimationFrame(() => {
                startButton.classList.remove('zoomOut');
                startButton.classList.add('animated', 'zoomIn');
            });
        });

        startButton.addEventListener('click', chain.start);

        document.addEventListener('keypress', function (event) {
            if (event.which === 32) {
                if (!chain.toggle()) {
                    window.location.hash = `#${timer.getTime()}`;
                }
            }
        })
    };

    const setIsQuiet = function (isQuiet) {
        _isQuiet = isQuiet;
    };

    const node = document.querySelector(selector);
    node.classList.add('diaps');
    node.innerHTML = `
<button type="button" class="diaps__start">
    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
        <path d="M19.982,14.438l-6.24-4.536c-0.229-0.166-0.533-0.191-0.784-0.062c-0.253,0.128-0.411,0.388-0.411,0.669v9.069
c0,0.284,0.158,0.543,0.411,0.671c0.107,0.054,0.224,0.081,0.342,0.081c0.154,0,0.31-0.049,0.442-0.146l6.24-4.532
c0.197-0.145,0.312-0.369,0.312-0.607C20.295,14.803,20.177,14.58,19.982,14.438z"></path>
<path d="M15.026,0.002C6.726,0.002,0,6.728,0,15.028c0,8.297,6.726,15.021,15.026,15.021c8.298,0,15.025-6.725,15.025-15.021
C30.052,6.728,23.324,0.002,15.026,0.002z M15.026,27.542c-6.912,0-12.516-5.601-12.516-12.514c0-6.91,5.604-12.518,12.516-12.518
c6.911,0,12.514,5.607,12.514,12.518C27.541,21.941,21.937,27.542,15.026,27.542z"></path>
    </svg>
</button>
<div class="diaps__timer"></div>`;
    const layers = {};
    layers.background = Layer(node, 'background');
    layers.center = Layer(node, 'center');
    layers.top = Layer(node, 'top');
    layers.left = Layer(node, 'left');
    layers.right = Layer(node, 'right');
    layers.bottom = Layer(node, 'bottom');
    layers.nw = Layer(node, 'nw');
    layers.ne = Layer(node, 'ne');
    layers.se = Layer(node, 'se');
    layers.sw = Layer(node, 'sw');
    let _isQuiet = false;
    const controls = {Image, Video, Text, Sound, layers, setIsQuiet};

    initialize();
};
