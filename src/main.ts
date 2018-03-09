import { Canvas } from './core/mod';
import { BlockBuilder, Color, Game, GameBuilder } from './game/mod';
import { PlayOnTime } from './mods/play_on_time';
import { UI } from './ui/ui'
import { BackgroundSound, SoundFX } from './sound/sound';

const main = () => {
    const ui = UI.instance_of();
    const background_sound = BackgroundSound.instance_of();
    const sound_fx = SoundFX.instance_of();

    const canvas = new Canvas('canvas')
        .set_client_dimensions()
        .clear_color(0.05, 0.05, 0.05, 1.0)
        .clear();

    const block_builder = new BlockBuilder()
        .with_size(canvas.height() / 15)
        .with_border_size(canvas.height() / 23)
        .with_color(Color.from_u8(247, 220, 111, 1.0))
        .with_color(Color.from_u8(40, 116, 166, 1.0))
        .with_color(Color.from_u8(34, 153, 84, 1.0))
        .with_color(Color.from_u8(231, 76, 60, 1.0))
        .with_color(Color.from_u8(108, 52, 131, 1.0))
        .with_swap_transition(150, 'linear')
        .with_hide_transition(225, 'linear')
        .with_shift_transition(275, 'linear')
        .with_select_transition(150, 'linear');

    const game = new GameBuilder()
        .with_canvas(canvas)
        .with_dimensions(8, 8)
        .with_origin(canvas.width() / 8, canvas.height() / 3)
        .with_block(block_builder.build())
        .build();

    const play_on_time = new PlayOnTime(120, game);

    ui.play_mods.buttons.play_on_time.add_event_callback('click', () => {
        background_sound.main_theme.reset().play();
        ui.info_panel.set_time(play_on_time.duration);

        play_on_time.set_time_callback(time_left => {
            ui.info_panel.set_time(time_left);
            ui.info_panel.set_score(game.score());
        });

        const handler = (ev: MouseEvent) => {
            if (game.is_selected_block()) {
                game.selected_swap_with(ev);
            } else {
                game.select(ev);
            }
        };

        play_on_time.set_game_over_callback(() => {
            background_sound.main_theme.stop();

            ui.main_page.buttons.continue.element.off();
            ui.game_over.element.on();
            ui.game_over.set_score(game.score());

            canvas.event_target().removeEventListener('click', handler);

            ui.info_panel.set_score(game.reset_score());
        });

        canvas.event_target().addEventListener('click', handler);

        play_on_time.start_game();
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