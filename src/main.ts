import { Canvas } from './core/mod';
import { BlockBuilder, Color, Game, GameBuilder } from './game/mod';
import { PlayOnTime } from './mods/play_on_time';
import { UI } from './ui/ui'
import { BackgroundSound, SoundFX } from './sound/sound';

class GameWindow {
    public readonly canvas: Canvas;
    public readonly block_builder: BlockBuilder;
    public readonly game_builder: GameBuilder;
    public readonly play_on_time: PlayOnTime;

    constructor() {
        this.canvas = new Canvas('canvas')
            .set_client_dimensions()
            .clear_color(0.05, 0.05, 0.05, 1.0)
            .clear();

        this.block_builder = new BlockBuilder()
            .with_size(this.canvas.height() / 15)
            .with_border_size(this.canvas.height() / 23)
            .with_color(Color.from_u8(247, 220, 111, 1.0))
            .with_color(Color.from_u8(40, 116, 166, 1.0))
            .with_color(Color.from_u8(34, 153, 84, 1.0))
            .with_color(Color.from_u8(231, 76, 60, 1.0))
            .with_color(Color.from_u8(108, 52, 131, 1.0))
            .with_swap_transition(350, 'linear')
            .with_hide_transition(350, 'linear')
            .with_shift_transition(350, 'linear')
            .with_select_transition(250, 'linear');

        this.game_builder = new GameBuilder()
            .with_canvas(this.canvas)
            .with_dimensions(8, 8)
            .with_origin(this.canvas.width() / 8, this.canvas.height() / 3)
            .with_block(this.block_builder.build());

        this.play_on_time = new PlayOnTime(120, this.game_builder);
    }
}

const main = () => {
    const game_window = new GameWindow();

    UI.instance_of().play_mods.buttons.play_on_time.add_event_callback('click', () => {
        const game = game_window.play_on_time;

        game.init_game();
        game.set_time_callback(time_left => console.log(time_left));
        game.start_game();
        BackgroundSound.instance_of().main_theme.reset().play();

        game.set_time_callback(time_left => {
            const res = time_left.toString();
            UI.instance_of().info_panel.time_element.element.textContent = res.length >= 2 ? res : `0${res}`;
            UI.instance_of().info_panel.score_element.element.textContent = game.context().score().toString();

            if (time_left === 20) {
                UI.instance_of().info_panel.add_time_is_low();
            }
        });

        const handler = (ev: MouseEvent) => {
            if (game.context().is_selected_block()) {
                game.context().selected_swap_with(ev);
            } else {
                game.context().select(ev);
            }
        };

        game.set_game_over_callback(() => {
            game_window.canvas
                .clear();

            UI.instance_of().info_panel.remove_time_is_low();
            UI.instance_of().main_page.buttons.continue.element.off();
            UI.instance_of().game_over.element.on();
            UI.instance_of().game_over.score_element.element.textContent = game.context().score().toString();

            BackgroundSound.instance_of().main_theme.stop();

            game_window.canvas.event_target().removeEventListener('click', handler);
        });

        game_window.canvas.event_target().addEventListener('click', handler);
    });

    UI.instance_of().settings.background_sound.element.off();

    const background_sound_callback = (ev?: MouseEvent) => {
        if (UI.instance_of().settings.background_sound.element.is_off()) {
            BackgroundSound.instance_of().main_theme.off();
        } else {
            BackgroundSound.instance_of().main_theme.on();
        }
    };

    background_sound_callback();
    UI.instance_of().settings.background_sound.button.add_event_callback('click', background_sound_callback);

    const sound_fx_callback = (ev?: MouseEvent) => {
        if (UI.instance_of().settings.sound_fx.element.is_off()) {
            SoundFX.instance_of().hide.off();
            SoundFX.instance_of().shift.off();
        } else {
            SoundFX.instance_of().hide.on();
            SoundFX.instance_of().shift.on();
        }
    };

    sound_fx_callback();
    UI.instance_of().settings.sound_fx.button.add_event_callback('click', sound_fx_callback)

};

window.addEventListener('load', main);