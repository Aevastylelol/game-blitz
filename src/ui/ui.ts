import { Game } from "../game/mod";

class Button {
    public readonly button: Element;

    private readonly event_callbacks_map: Map<string, Array<(ev: DocumentEventMap[keyof DocumentEventMap]) => void>>

    constructor(selector: string) {
        this.button = document.querySelector(selector);
        this.event_callbacks_map = new Map();
    }

    public readonly add_event_callback = <K extends keyof DocumentEventMap>(event: K, callbackfn: (ev: DocumentEventMap[K]) => void) => {
        if (!this.event_callbacks_map.has(event)) {
            const cbs = [callbackfn];

            this.event_callbacks_map.set(event, cbs);

            this.button.addEventListener(event, (ev: DocumentEventMap[K]) => {
                cbs.forEach(cb => cb(ev));
            });
        } else {
            this.event_callbacks_map.get(event).push(callbackfn);
        }
    }
}

class ElementController {
    public readonly element: Element;

    private readonly off_class: string;

    constructor(selector: string, off_class: string) {
        this.element = document.querySelector(selector);
        this.off_class = off_class;
    }

    public readonly on = () => {
        this.element.classList.remove(this.off_class);
    }

    public readonly off = () => {
        this.element.classList.add(this.off_class);
    }

    public readonly is_off = (): boolean => {
        return this.element.classList.contains(this.off_class);
    }
}

class ElementsController {
    public readonly elements: NodeListOf<Element>;

    private readonly off_class: string;

    constructor(selector: string, off_class: string) {
        this.elements = document.querySelectorAll(selector);
        this.off_class = off_class;
    }

    public readonly on = (): void => {
        this.elements.forEach(el => el.classList.remove(this.off_class));
    }

    public readonly off = (): void => {
        this.elements.forEach(el => el.classList.add(this.off_class));
    }
}

class MainPageButton {
    public readonly button: Button;
    public readonly element: ElementController;

    constructor(selector: string) {
        this.button = new Button(selector);
        this.element = new ElementController(selector, 'menu__item_off');
    }
}

class MainPage {
    public readonly element: ElementController;
    public readonly buttons: {
        continue: MainPageButton,
        new_game: MainPageButton,
        settings: MainPageButton,
    };

    constructor() {
        this.element = new ElementController('.main-page', 'main-page_off');

        this.buttons = {
            continue: new MainPageButton('.button__continue'),
            new_game: new MainPageButton('.button__new-game'),
            settings: new MainPageButton('.button__settings'),
        };
    }
}

class SubWindows {
    public readonly elements: ElementsController;

    constructor() {
        this.elements = new ElementsController('.sub-window', 'sub-window_off');
    }
}

class PlayMods {
    public readonly element: ElementController;
    public readonly buttons: {
        play_on_time: Button
    };

    constructor() {
        this.element = new ElementController('.play-mods', 'sub-window_off');

        this.buttons = {
            play_on_time: new Button('.button__play-on-time')
        };
    }
}

class Settings {
    public readonly element: ElementController;
    public readonly background_sound: { button: Button, element: ElementController };
    public readonly sound_fx: { button: Button, element: ElementController };

    constructor() {
        this.element = new ElementController('.settings', 'sub-window_off');
        this.background_sound = {
            button: new Button('.background-music'),
            element: new ElementController('.background-music', 'sound__item_off'),
        };
        this.sound_fx = {
            button: new Button('.sound-fx'),
            element: new ElementController('.sound-fx', 'sound__item_off'),
        };

        document.querySelectorAll('.sound__item').forEach(el => el.addEventListener('click', (ev: MouseEvent) => {
            if (el.classList.contains('sound__item_off')) {
                el.classList.remove('sound__item_off');
            } else {
                el.classList.add('sound__item_off');
            }
        }));
    }
}

class InfoPanel {
    public readonly element: ElementController;
    public readonly time_element: ElementController;
    public readonly score_element: ElementController;


    constructor() {
        this.element = new ElementController('.info-panel', 'info-panel_off');
        this.time_element = new ElementController('.info-panel__time', 'info-panel__item_off');
        this.score_element = new ElementController('.info-panel__score', 'info-panel__item_off');
    }

    public readonly add_time_is_low = () => {
        document.querySelector('.info-panel__time-wrapper').classList.add('info-panel__time_is-low');
    }

    public readonly remove_time_is_low = () => {
        document.querySelector('.info-panel__time-wrapper').classList.remove('info-panel__time_is-low');
    }

    public readonly set_time = (second: number) => {
        const min = second / 60 | 0;
        const sec = second - min * 60;

        this.time_element.element.textContent = `${min >= 10 ? min : `0${min}`}:${sec >= 10 ? sec : `0${sec}`}`;

        if (second < 20) {
            this.add_time_is_low();
        } else {
            this.remove_time_is_low();
        }
    }

    public readonly set_score = (score: number) => {
        this.score_element.element.textContent = score.toString()
    }
}

class GameOver {
    public readonly element: ElementController;
    public readonly score_element: ElementController;

    constructor() {
        this.element = new ElementController('.game-over', 'game-over_off');
        this.score_element = new ElementController('.game-over__score', 'none');
    }

    public readonly set_score = (score: number) => {
        this.score_element.element.textContent = score.toString();
    }
}

class UI {
    private static instance: UI;

    public readonly main_page: MainPage;
    public readonly sub_windows: SubWindows;
    public readonly play_mods: PlayMods;
    public readonly settings: Settings;
    public readonly info_panel: InfoPanel;
    public readonly game_over: GameOver;

    private constructor() {
        this.main_page = new MainPage();
        this.sub_windows = new SubWindows();
        this.play_mods = new PlayMods();
        this.settings = new Settings();
        this.info_panel = new InfoPanel();
        this.game_over = new GameOver();

        this.main_page_init();
        this.play_mods_init();

        window.document.addEventListener('keydown', (ev: KeyboardEvent) => {
            if (ev.code === 'Escape') {
                this.sub_windows.elements.off();
                this.main_page.element.on();
                this.info_panel.element.off();
                this.game_over.element.off();
            }
        })
    }

    public static readonly instance_of = (): UI => {
        if (UI.instance === void 0) {
            UI.instance = new UI();
        }

        return UI.instance;
    }

    private readonly main_page_init = () => {
        this.main_page.buttons.continue.button.add_event_callback('click', () => {
            this.sub_windows.elements.off();
            this.main_page.element.off();
            this.info_panel.element.on();
        });

        this.main_page.buttons.new_game.button.add_event_callback('click', () => {
            this.play_mods.element.on();
        });

        this.main_page.buttons.settings.button.add_event_callback('click', () => {
            this.settings.element.on();
        });
    }

    private readonly play_mods_init = () => {
        this.play_mods.buttons.play_on_time.add_event_callback('click', () => {
            this.main_page.buttons.continue.element.on();
            this.sub_windows.elements.off();
            this.main_page.element.off();
            this.info_panel.element.on();
        });
    }
}

export { UI }