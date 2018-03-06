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
            .with_swap_transition(250, 'linear')
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
    const ui = UI.instance_of();
    const background_sound = BackgroundSound.instance_of();
    const sound_fx = SoundFX.instance_of();

    ui.play_mods.buttons.play_on_time.add_event_callback('click', () => {
        const game = game_window.play_on_time.init_game();
        const game_context = game.context();

        background_sound.main_theme.reset().play();

        game.set_time_callback(time_left => {
            ui.info_panel.set_time(time_left);
            ui.info_panel.set_score(game_context.score());
        });

        const handler = (ev: MouseEvent) => {
            if (game_context.is_selected_block()) {
                game_context.selected_swap_with(ev);
            } else {
                game_context.select(ev);
            }
        };

        game.set_game_over_callback(() => {
            background_sound.main_theme.stop();

            game_window.canvas.clear();

            ui.main_page.buttons.continue.element.off();
            ui.game_over.element.on();
            ui.game_over.set_score(game_context.score());

            game_window.canvas.event_target().removeEventListener('click', handler);
        });

        game_window.canvas.event_target().addEventListener('click', handler);

        game.start_game();
    });

    ui.settings.background_sound.element.off();

    const background_sound_callback = (ev?: MouseEvent) => {
        if (ui.settings.background_sound.element.is_off()) {
            background_sound.main_theme.off();
        } else {
            background_sound.main_theme.on();
        }
    };

    background_sound_callback();
    ui.settings.background_sound.button.add_event_callback('click', background_sound_callback);

    const sound_fx_callback = (ev?: MouseEvent) => {
        if (ui.settings.sound_fx.element.is_off()) {
            sound_fx.hide.off();
            sound_fx.shift.off();
        } else {
            sound_fx.hide.on();
            sound_fx.shift.on();
        }
    };

    sound_fx_callback();
    ui.settings.sound_fx.button.add_event_callback('click', sound_fx_callback)
};

window.addEventListener('load', main);