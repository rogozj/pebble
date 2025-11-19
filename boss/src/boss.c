#include <pebble.h>
#include "src/resource_ids.auto.h"

#define DISPLAY_SECONDS true
#define DISPLAY_FILLED_HANDS true
#define DISPLAY_DATE true
#define DISPLAY_LOGO true
#define HOUR_VIBRATION false
#define HOUR_VIBRATION_START 8
#define HOUR_VIBRATION_END 20

static Window *s_window;
static BitmapLayer *s_background_layer;
static GBitmap *s_background_bitmap;
#if DISPLAY_SECONDS
static Layer *s_second_display_layer;
#endif
static Layer *s_time_display_layer;
#if DISPLAY_DATE
static TextLayer *s_date_layer;
static GFont s_date_font;
static char s_date_text[] = "12";
#endif

#if DISPLAY_FILLED_HANDS
const GPathInfo HOUR_HAND_PATH_POINTS = {
  4,
  (GPoint []) {
    {0, 0},
    {5, -21},    // Changed from 4, -20 (+1 in both)
    {0, -41},    // Changed from 0, -40 (+1)
    {-5, -21},   // Changed from -4, -20 (+1 in both)
  }
};

const GPathInfo MINUTE_HAND_PATH_POINTS = {
  4,
  (GPoint []) {
    {0, 0},
    {5, -21},    // Changed from 4, -20 (+1 in both)
    {0, -61},    // Changed from 0, -60 (+1)
    {-5, -21},   // Changed from -4, -20 (+1 in both)
  }
};

static GPath *s_hour_hand_path;
static GPath *s_minute_hand_path;
#endif

#if DISPLAY_SECONDS
void second_display_layer_update_callback(Layer *layer, GContext *ctx) {
  (void)layer;

  time_t temp = time(NULL);
  struct tm *t = localtime(&temp);

  int32_t second_angle = t->tm_sec * (TRIG_MAX_ANGLE / 60);
  int second_hand_length = 70;

  graphics_context_set_compositing_mode(ctx, GCompOpSet);
  graphics_context_set_fill_color(ctx, GColorWhite);
  graphics_context_set_stroke_color(ctx, GColorWhite);

  GPoint center = GPoint(144/2, 168/2);
  GPoint second = GPoint(
    center.x + second_hand_length * sin_lookup(second_angle) / TRIG_MAX_RATIO,
    center.y + (-second_hand_length) * cos_lookup(second_angle) / TRIG_MAX_RATIO
  );

  graphics_draw_line(ctx, center, second);
}
#endif

void time_display_layer_update_callback(Layer *layer, GContext *ctx) {
  (void)layer;
#if DISPLAY_FILLED_HANDS
  time_t temp = time(NULL);
  struct tm *t = localtime(&temp);

  unsigned int hour_angle = t->tm_hour * 30 + t->tm_min / 2;
  unsigned int minute_angle = t->tm_min * 6;
  gpath_rotate_to(s_hour_hand_path, (TRIG_MAX_ANGLE / 360) * hour_angle);
  gpath_rotate_to(s_minute_hand_path, (TRIG_MAX_ANGLE / 360) * minute_angle);
  
  graphics_context_set_compositing_mode(ctx, GCompOpSet);
  //graphics_context_set_antialiased(ctx, true); // Enable anti-aliasing
  
  // Draw filled first
  graphics_context_set_fill_color(ctx, GColorWhite);
  gpath_draw_filled(ctx, s_hour_hand_path);
  gpath_draw_filled(ctx, s_minute_hand_path);
  
  // Then outline on top
  //graphics_context_set_stroke_color(ctx, GColorWhite);
  //graphics_context_set_stroke_width(ctx, 1);
  //gpath_draw_outline(ctx, s_hour_hand_path);
  //gpath_draw_outline(ctx, s_minute_hand_path);
#else
  //Old hands drawing section, new above based on Segment Six watchface - allows to draw filled shapes
  time_t temp = time(NULL);
  struct tm *t = localtime(&temp);

  int32_t hour_angle = (t->tm_hour % 12) * (TRIG_MAX_ANGLE/12) + t->tm_min * (TRIG_MAX_ANGLE/720);
  int32_t hour_angle_offset1 = 0;
  int32_t hour_angle_offset2 = 0;
  int32_t minute_angle = t->tm_min * (TRIG_MAX_ANGLE/60);
  int32_t minute_angle_offset1 = 0;
  int32_t minute_angle_offset2 = 0;

  int hour_hand_length = 40;
  int minute_hand_length = 60;

  if(hour_angle<TRIG_MAX_ANGLE/36)
  {
     hour_angle_offset1 = hour_angle + (TRIG_MAX_ANGLE/36)*35;
     hour_angle_offset2 = hour_angle + TRIG_MAX_ANGLE/36;
  }
  else if(hour_angle>(TRIG_MAX_ANGLE/36)*35)
  {
     hour_angle_offset1 = hour_angle - TRIG_MAX_ANGLE/36;
     hour_angle_offset2 = hour_angle - (TRIG_MAX_ANGLE/36)*35;
  }
  else
  {
     hour_angle_offset1 = hour_angle - TRIG_MAX_ANGLE/36;
     hour_angle_offset2 = hour_angle + TRIG_MAX_ANGLE/36;
  }

  if(minute_angle<TRIG_MAX_ANGLE/36)
  {
     minute_angle_offset1 = minute_angle + (TRIG_MAX_ANGLE/36)*35;
     minute_angle_offset2 = minute_angle + TRIG_MAX_ANGLE/36;
  }
  else if(hour_angle>(TRIG_MAX_ANGLE/36)*35)
  {
     minute_angle_offset1 = minute_angle - TRIG_MAX_ANGLE/36;
     minute_angle_offset2 = minute_angle - (TRIG_MAX_ANGLE/36)*35;
  }
  else
  {
     minute_angle_offset1 = minute_angle - TRIG_MAX_ANGLE/36;
     minute_angle_offset2 = minute_angle + TRIG_MAX_ANGLE/36;
  }

  GPoint center = GPoint(144/2, 168/2);
  GPoint hour = GPoint(
    center.x + hour_hand_length * sin_lookup(hour_angle)/TRIG_MAX_RATIO,
    center.y + (-hour_hand_length) * cos_lookup(hour_angle)/TRIG_MAX_RATIO
  );
  GPoint hour_offset1 = GPoint(
    center.x + (hour_hand_length/2) * sin_lookup(hour_angle_offset1)/TRIG_MAX_RATIO,
    center.y + (-(hour_hand_length/2)) * cos_lookup(hour_angle_offset1)/TRIG_MAX_RATIO
  );
  GPoint hour_offset2 = GPoint(
    center.x + (hour_hand_length/2) * sin_lookup(hour_angle_offset2)/TRIG_MAX_RATIO,
    center.y + (-(hour_hand_length/2)) * cos_lookup(hour_angle_offset2)/TRIG_MAX_RATIO
  );
  GPoint minute = GPoint(
    center.x + minute_hand_length * sin_lookup(minute_angle)/TRIG_MAX_RATIO,
    center.y + (-minute_hand_length) * cos_lookup(minute_angle)/TRIG_MAX_RATIO
  );
  GPoint minute_offset1 = GPoint(
    center.x + (minute_hand_length/3) * sin_lookup(minute_angle_offset1)/TRIG_MAX_RATIO,
    center.y + (-(minute_hand_length/3)) * cos_lookup(minute_angle_offset1)/TRIG_MAX_RATIO
  );
  GPoint minute_offset2 = GPoint(
    center.x + (minute_hand_length/3) * sin_lookup(minute_angle_offset2)/TRIG_MAX_RATIO,
    center.y + (-(minute_hand_length/3)) * cos_lookup(minute_angle_offset2)/TRIG_MAX_RATIO
  );

  graphics_context_set_fill_color(ctx, GColorWhite);

  graphics_draw_line(ctx, center, hour_offset1);
  graphics_draw_line(ctx, hour_offset1, hour);
  graphics_draw_line(ctx, hour, hour_offset2);
  graphics_draw_line(ctx, hour_offset2, center);

  graphics_draw_line(ctx, center, minute_offset1);
  graphics_draw_line(ctx, minute_offset1, minute);
  graphics_draw_line(ctx, minute, minute_offset2);
  graphics_draw_line(ctx, minute_offset2, center);
#endif
}

#if DISPLAY_DATE
void draw_date(struct tm *tick_time) {
  strftime(s_date_text, sizeof(s_date_text), "%d", tick_time);
  text_layer_set_text(s_date_layer, s_date_text);
}
#endif

static void window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  // Initialize background
  s_background_layer = bitmap_layer_create(bounds);
#if DISPLAY_DATE && DISPLAY_LOGO
  s_background_bitmap = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_BACKGROUND_DATE_LOGO);
#elif DISPLAY_DATE
  s_background_bitmap = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_BACKGROUND_DATE);
#elif DISPLAY_LOGO
  s_background_bitmap = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_BACKGROUND_LOGO);
#else
  s_background_bitmap = gbitmap_create_with_resource(RESOURCE_ID_IMAGE_BACKGROUND);
#endif
  bitmap_layer_set_bitmap(s_background_layer, s_background_bitmap);
  layer_add_child(window_layer, bitmap_layer_get_layer(s_background_layer));

#if DISPLAY_DATE
  s_date_font = fonts_load_custom_font(resource_get_handle(RESOURCE_ID_FONT_JOSEFINSLAB_BOLDITALIC_15));
  s_date_layer = text_layer_create(GRect(60, 120, 22, 19));
  text_layer_set_text_alignment(s_date_layer, GTextAlignmentCenter);
  text_layer_set_text_color(s_date_layer, GColorBlack);
  text_layer_set_background_color(s_date_layer, GColorClear);
  text_layer_set_font(s_date_layer, s_date_font);
  layer_add_child(window_layer, text_layer_get_layer(s_date_layer));
  time_t temp = time(NULL);
  struct tm *t = localtime(&temp);
  draw_date(t);
#endif

  s_time_display_layer = layer_create(bounds);
  layer_set_update_proc(s_time_display_layer, time_display_layer_update_callback);
  layer_add_child(window_layer, s_time_display_layer);

#if DISPLAY_FILLED_HANDS
  s_minute_hand_path = gpath_create(&MINUTE_HAND_PATH_POINTS);
  gpath_move_to(s_minute_hand_path, grect_center_point(&bounds));
  s_hour_hand_path = gpath_create(&HOUR_HAND_PATH_POINTS);
  gpath_move_to(s_hour_hand_path, grect_center_point(&bounds));
#endif

#if DISPLAY_SECONDS
  s_second_display_layer = layer_create(bounds);
  layer_set_update_proc(s_second_display_layer, second_display_layer_update_callback);
  layer_add_child(window_layer, s_second_display_layer);
#endif
}

static void window_unload(Window *window) {
#if DISPLAY_DATE
  text_layer_destroy(s_date_layer);
  fonts_unload_custom_font(s_date_font);
#endif
#if DISPLAY_FILLED_HANDS
  gpath_destroy(s_hour_hand_path);
  gpath_destroy(s_minute_hand_path);
#endif
#if DISPLAY_SECONDS
  layer_destroy(s_second_display_layer);
#endif
  layer_destroy(s_time_display_layer);
  bitmap_layer_destroy(s_background_layer);
  gbitmap_destroy(s_background_bitmap);
}

static void tick_handler(struct tm *tick_time, TimeUnits units_changed) {
  if (tick_time->tm_sec == 0) {
    layer_mark_dirty(s_time_display_layer);
#if DISPLAY_DATE
    if (tick_time->tm_min == 0 && tick_time->tm_hour == 0) {
      draw_date(tick_time);
    }
#endif
#if HOUR_VIBRATION
    if (tick_time->tm_min == 0 &&
        tick_time->tm_hour >= HOUR_VIBRATION_START &&
        tick_time->tm_hour <= HOUR_VIBRATION_END) {
      vibes_double_pulse();
    }
#endif
  }

#if DISPLAY_SECONDS
  layer_mark_dirty(s_second_display_layer);
#endif
}

static void init(void) {
  s_window = window_create();
  window_set_window_handlers(s_window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });
  window_stack_push(s_window, true);

  tick_timer_service_subscribe(
#if DISPLAY_SECONDS
    SECOND_UNIT,
#else
    MINUTE_UNIT,
#endif
    tick_handler
  );
}

static void deinit(void) {
  window_destroy(s_window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
  return 0;
}
