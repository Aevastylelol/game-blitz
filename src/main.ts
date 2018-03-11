import { BackgroundSound, SoundFX } from './sound/sound';
import { BlockBuilder, Color, Game, GameBuilder } from './game/mod';
import { Canvas } from './core/mod';
import { PlayOnTime } from './mods/play_on_time';
import { UI } from './ui/ui'

class App {
    private static instance: App;

    private readonly ui: UI;
    private readonly background_sound: BackgroundSound;
    private readonly sound_fx: SoundFX;

    private readonly canvas: Canvas;
    private readonly game: Game;

    private readonly play_on_time: PlayOnTime;

    private constructor() {
        this.ui = UI.instance_of();
        this.background_sound = BackgroundSound.instance_of()
        this.sound_fx = SoundFX.instance_of();

        this.canvas = new Canvas('canvas')
            .set_client_dimensions()
            .clear_color(0.05, 0.05, 0.05, 1.0)
            .clear();

        const block = new BlockBuilder()
            .with_size(this.canvas.height() / 15)
            .with_border_size(this.canvas.height() / 23)
            .with_color(Color.from_u8(247, 220, 111, 1.0))
            .with_color(Color.from_u8(40, 116, 166, 1.0))
            .with_color(Color.from_u8(34, 153, 84, 1.0))
            .with_color(Color.from_u8(231, 76, 60, 1.0))
            .with_color(Color.from_u8(108, 52, 131, 1.0))
            .with_swap_transition(150, 'linear')
            .with_hide_transition(225, 'accelerated')
            .with_shift_transition(300, 'accelerated')
            .with_select_transition(150, 'linear')
            .build();

        this.game = new GameBuilder()
            .with_canvas(this.canvas)
            .with_dimensions(8, 8)
            .with_origin(this.canvas.width() / 8, this.canvas.height() / 3)
            .with_block(block)
            .build();

        this.play_on_time = new PlayOnTime(120, this.game);

        this.init_sound();
        this.init_play_on_time();
    }

    public static readonly initialize = () => {
        if (App.instance === void 0) {
            App.instance = new App();
        }
    }

    private readonly init_sound = () => {
        this.ui.settings.background_sound.element.off();

        const background_sound_callback = (ev?: MouseEvent) => {
            if (this.ui.settings.background_sound.element.is_off()) {
                this.background_sound.main_theme.off();
            } else {
                this.background_sound.main_theme.on();
            }
        };

        background_sound_callback();
        this.ui.settings.background_sound.button.add_event_callback('click', background_sound_callback);

        const sound_fx_callback = (ev?: MouseEvent) => {
            if (this.ui.settings.sound_fx.element.is_off()) {
                this.sound_fx.hide.off();
                this.sound_fx.shift.off();
            } else {
                this.sound_fx.hide.on();
                this.sound_fx.shift.on();
            }
        };

        sound_fx_callback();
        this.ui.settings.sound_fx.button.add_event_callback('click', sound_fx_callback);
    }

    private readonly init_play_on_time = () => {
        this.ui.play_mods.buttons.play_on_time.add_event_callback('click', () => {
            this.background_sound.main_theme.reset().play();
            this.ui.info_panel.set_time(this.play_on_time.duration);

            this.play_on_time.set_time_callback(time_left => {
                this.ui.info_panel.set_time(time_left);
                this.ui.info_panel.set_score(this.game.score());
            });

            const handler = (ev: MouseEvent) => {
                if (this.game.is_selected_block()) {
                    this.game.selected_swap_with(ev);
                } else {
                    this.game.select(ev);
                }
            };

            this.play_on_time.set_game_over_callback(() => {
                this.background_sound.main_theme.stop();

                this.ui.main_page.buttons.continue.element.off();
                this.ui.game_over.element.on();
                this.ui.game_over.set_score(this.game.score());

                this.canvas.event_target().removeEventListener('click', handler);

                this.ui.info_panel.set_score(this.game.reset_score());
            });

            this.canvas.event_target().addEventListener('click', handler);

            this.play_on_time.start_game();
        });
    };
}

window.addEventListener('load', App.initialize);