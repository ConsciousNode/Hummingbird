#!/usr/bin/env python3
"""Generate the x86 oracle harness: one asm routine per instruction form, run on a real
x86 CPU (32-bit mode) to produce tests/cpu-oracle.jsonl, which tests/cpu-oracle.js replays
in Hummingbird. Build:  python3 tests/oracle/gen.py && gcc -m32 -O1 -o /tmp/oracle \
  tests/oracle/ops.S tests/oracle/oracle.c && /tmp/oracle > tests/cpu-oracle.jsonl
"""
import os
here = os.path.dirname(os.path.abspath(__file__))
R8, R16, R32 = ('al', 'bl'), ('ax', 'bx'), ('eax', 'ebx')
ops = []  # (name, asm, kind, size)
for m in ['add', 'adc', 'sub', 'sbb', 'and', 'or', 'xor', 'cmp', 'test']:
    for sz, (a, b) in ((8, R8), (16, R16), (32, R32)):
        ops.append((f'{m}{sz}', f'{m} {a}, {b}', 'logic' if m in ('and', 'or', 'xor', 'test') else 'arith', sz))
for m in ['inc', 'dec', 'neg', 'not']:
    for sz, (a, _) in ((8, R8), (16, R16), (32, R32)):
        ops.append((f'{m}{sz}', f'{m} {a}', 'not' if m == 'not' else 'arith', sz))
for m in ['shl', 'shr', 'sar', 'rol', 'ror', 'rcl', 'rcr']:
    for sz, (a, _) in ((8, R8), (16, R16), (32, R32)):
        ops.append((f'{m}{sz}_cl', f'{m} {a}, cl', 'shift_' + m, sz))
    ops.append((f'{m}32_1', f'{m} eax, 1', 'shift1_' + m, 32))
for m in ['shld', 'shrd']:
    ops.append((f'{m}32', f'{m} eax, ebx, cl', 'shxd', 32))
    ops.append((f'{m}16', f'{m} ax, bx, cl', 'shxd', 16))
for m in ['mul', 'imul']:
    ops.append((f'{m}8', f'{m} bl', 'mul', 8)); ops.append((f'{m}16', f'{m} bx', 'mul', 16)); ops.append((f'{m}32', f'{m} ebx', 'mul', 32))
ops += [('imul32_rr', 'imul eax, ebx', 'mul', 32), ('imul16_rr', 'imul ax, bx', 'mul', 16),
        ('imul32_rri', 'imul eax, ebx, -7', 'mul', 32), ('imul32_rri32', 'imul eax, ebx, 0x12345', 'mul', 32)]
for m in ['div', 'idiv']:
    ops.append((f'{m}8', f'{m} bl', m, 8)); ops.append((f'{m}16', f'{m} bx', m, 16)); ops.append((f'{m}32', f'{m} ebx', m, 32))
for m in ['bsf', 'bsr']:
    ops.append((f'{m}32', f'{m} eax, ebx', 'bitscan', 32)); ops.append((f'{m}16', f'{m} ax, bx', 'bitscan', 16))
for m in ['bt', 'bts', 'btr', 'btc']:
    ops.append((f'{m}32', f'{m} eax, ebx', 'bt', 32)); ops.append((f'{m}16', f'{m} ax, bx', 'bt', 16))
ops += [('bswap', 'bswap eax', 'plain', 32), ('xadd32', 'xadd eax, ebx', 'arith', 32), ('xadd8', 'xadd al, bl', 'arith', 8),
        ('cmpxchg32', 'cmpxchg ebx, ecx', 'cmpxchg', 32), ('cmpxchg8', 'cmpxchg bl, cl', 'cmpxchg', 8),
        ('daa', 'daa', 'bcd_daa', 8), ('das', 'das', 'bcd_daa', 8), ('aaa', 'aaa', 'bcd_aaa', 8), ('aas', 'aas', 'bcd_aaa', 8),
        ('aam', 'aam', 'bcd_aam', 8), ('aad', 'aad', 'bcd_aam', 8),
        ('cbw', 'cbw', 'plain', 16), ('cwde', 'cwde', 'plain', 32), ('cwd', 'cwd', 'plain', 16), ('cdq', 'cdq', 'plain', 32),
        ('movzx8', 'movzx eax, bl', 'plain', 32), ('movzx16', 'movzx eax, bx', 'plain', 32),
        ('movsx8', 'movsx eax, bl', 'plain', 32), ('movsx16', 'movsx eax, bx', 'plain', 32),
        ('lahf', 'lahf', 'plain', 8), ('sahf', 'sahf', 'plain', 8), ('cmc', 'cmc', 'plain', 8), ('xchg', 'xchg eax, ebx', 'plain', 32),
        ('lea_sib', 'lea eax, [ebx+ecx*4+0x1234]', 'plain', 32), ('lea_16', 'lea ax, [ebx+ecx*2-5]', 'plain', 16)]
for cc in ['o', 'no', 'b', 'ae', 'e', 'ne', 'be', 'a', 's', 'ns', 'p', 'np', 'l', 'ge', 'le', 'g']:
    ops.append((f'set{cc}', f'set{cc} al', 'plain', 8))

S = ['.intel_syntax noprefix', '.text']
for i, (name, asm, kind, sz) in enumerate(ops):
    S += [f'.globl op{i}_fn', f'.globl op{i}_b', f'.globl op{i}_e', f'op{i}_fn:',
          '  push ebx', '  push esi', '  push edi', '  push ebp', '  mov ebp, [esp+20]',
          '  mov eax, [ebp]', '  mov ebx, [ebp+4]', '  mov ecx, [ebp+8]', '  mov edx, [ebp+12]',
          '  push dword ptr [ebp+16]', '  popfd', f'op{i}_b:', f'  {asm}', f'op{i}_e:',
          '  pushfd', '  pop dword ptr [ebp+16]', '  mov [ebp], eax', '  mov [ebp+4], ebx', '  mov [ebp+8], ecx', '  mov [ebp+12], edx',
          '  pop ebp', '  pop edi', '  pop esi', '  pop ebx', '  ret']
S.append('.section .note.GNU-stack,"",@progbits')
open(os.path.join(here, 'ops.S'), 'w').write('\n'.join(S) + '\n')
C = ['#include "harness.h"']
C += [f'extern void op{i}_fn(unsigned*); extern unsigned char op{i}_b[], op{i}_e[];' for i in range(len(ops))]
C.append('const struct op OPS[] = {')
C += [f'  {{"{n}", "{k}", {s}, op{i}_fn, op{i}_b, op{i}_e}},' for i, (n, a, k, s) in enumerate(ops)]
C.append('};\nconst int N_OPS = %d;' % len(ops))
open(os.path.join(here, 'ops_table.h'), 'w').write('\n'.join(C) + '\n')
print(len(ops), 'ops')
