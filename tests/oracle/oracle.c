/* Runs every instruction form in ops.S on the host x86 CPU and prints the oracle.
 * Masks follow the Intel SDM: flags (and results) the manual calls undefined are not compared. */
#include <stdio.h>
#include <string.h>
#include <stdint.h>
#include "ops_table.h"
#define CF 0x001
#define PF 0x004
#define AF 0x010
#define ZF 0x040
#define SF 0x080
#define OF 0x800
#define ST (CF|PF|AF|ZF|SF|OF)
static uint32_t s = 0x9E3779B9u;
static uint32_t rnd(void) { s ^= s << 13; s ^= s >> 17; s ^= s << 5; return s; }
static const uint32_t EDGE[] = {0,1,2,9,0x0F,0x10,0x7F,0x80,0x99,0xFF,0x100,0x7FFF,0x8000,0xFFFF,0x10000,0x7FFFFFFF,0x80000000u,0xFFFFFFFFu,0xFFFFFF80u,0xFFFF8000u};
static uint32_t val(void) { return (rnd() % 10 < 3) ? EDGE[rnd() % 20] : rnd(); }
static const uint32_t CNT[] = {0,1,2,7,8,9,15,16,17,18,31,32,33,63};
int main(void) {
  printf("{\"ops\":[");
  for (int i = 0; i < N_OPS; i++) {
    printf("%s{\"name\":\"%s\",\"kind\":\"%s\",\"size\":%d,\"hex\":\"", i ? "," : "", OPS[i].name, OPS[i].kind, OPS[i].size);
    for (unsigned char *p = OPS[i].b; p < OPS[i].e; p++) printf("%02x", *p);
    printf("\"}");
  }
  printf("]}\n");
  for (int i = 0; i < N_OPS; i++) {
    const struct op *o = &OPS[i]; const char *k = o->kind; int sz = o->size;
    for (int n = 0; n < 200; n++) {
      uint32_t in[5], st[5], fm = ST, rm0 = 0xFFFFFFFFu;
      for (int j = 0; j < 4; j++) in[j] = val();
      in[4] = 0x202 | (rnd() & ST);
      if (!strncmp(k, "shift", 5) || !strcmp(k, "shxd")) in[2] = (rnd() & 1) ? CNT[rnd() % 14] : rnd();
      if (!strcmp(k, "cmpxchg") && (rnd() & 1)) in[1] = in[0];
      if (!strcmp(k, "div") || !strcmp(k, "idiv")) {
        for (;;) {               /* reject divisions that would trap */
          for (int j = 0; j < 4; j++) in[j] = val();
          int sg = !strcmp(k, "idiv");
          if (sz == 8) { uint32_t d = in[1] & 0xFF; if (!d) continue; int64_t a = sg ? (int16_t)in[0] : (in[0] & 0xFFFF), dv = sg ? (int64_t)(int8_t)d : (int64_t)d, q = a / dv;
                         if (sg ? (q < -128 || q > 127) : (q > 255)) continue; }
          else if (sz == 16) { uint32_t d = in[1] & 0xFFFF; if (!d) continue; uint32_t u = ((in[3] & 0xFFFF) << 16) | (in[0] & 0xFFFF);
                         int64_t a = sg ? (int32_t)u : (int64_t)u, dv = sg ? (int64_t)(int16_t)d : (int64_t)d, q = a / dv; if (sg ? (q < -32768 || q > 32767) : (q > 65535)) continue; }
          else { if (!in[1]) continue; uint64_t u = ((uint64_t)in[3] << 32) | in[0];
                 if (sg) { int64_t a = (int64_t)u, dv = (int32_t)in[1]; if (a == INT64_MIN && dv == -1) continue; int64_t q = a / dv; if (q < INT32_MIN || q > INT32_MAX) continue; }
                 else { if ((u / in[1]) > 0xFFFFFFFFull) continue; } }
          break;
        }
        fm = 0;
      }
      uint32_t c = in[2] & 31;
      if (!strcmp(k, "logic")) fm = ST & ~AF;
      else if (!strncmp(k, "shift_", 6) || !strncmp(k, "shift1_", 7)) {
        const char *m = strchr(k, '_') + 1; if (!strncmp(k, "shift1_", 7)) c = 1;
        if (c) {
          int rot = m[0] == 'r' && (m[1] == 'o' || m[1] == 'c');
          fm = rot ? ST : (ST & ~AF);
          if (c != 1) fm &= ~OF;
          if (!rot && sz < 32 && c >= (uint32_t)sz && strcmp(m, "sar")) fm &= ~CF;
        }
      } else if (!strcmp(k, "shxd")) {
        if (c) { fm = ST & ~AF; if (c != 1) fm &= ~OF; if (sz == 16 && c > 16) { fm = 0; rm0 = 0xFFFF0000u; } }
      } else if (!strcmp(k, "mul")) fm = CF | OF;
      else if (!strcmp(k, "bitscan")) { fm = ZF; if (((sz == 16) ? (in[1] & 0xFFFF) : in[1]) == 0) rm0 = (sz == 16) ? 0xFFFF0000u : 0; }
      else if (!strcmp(k, "bt")) fm = CF | ZF;
      else if (!strcmp(k, "bcd_daa")) fm = ST & ~OF;
      else if (!strcmp(k, "bcd_aaa")) fm = CF | AF;
      else if (!strcmp(k, "bcd_aam")) fm = SF | ZF | PF;
      memcpy(st, in, sizeof st);
      o->fn(st);
      printf("%d %x %x %x %x %x %x %x %x %x %x %x %x\n", i, in[0], in[1], in[2], in[3], in[4], st[0], st[1], st[2], st[3], st[4], fm, rm0);
    }
  }
  return 0;
}
