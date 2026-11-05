.intel_syntax noprefix
.text
.globl op0_fn
.globl op0_b
.globl op0_e
op0_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op0_b:
  add al, bl
op0_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op1_fn
.globl op1_b
.globl op1_e
op1_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op1_b:
  add ax, bx
op1_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op2_fn
.globl op2_b
.globl op2_e
op2_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op2_b:
  add eax, ebx
op2_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op3_fn
.globl op3_b
.globl op3_e
op3_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op3_b:
  adc al, bl
op3_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op4_fn
.globl op4_b
.globl op4_e
op4_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op4_b:
  adc ax, bx
op4_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op5_fn
.globl op5_b
.globl op5_e
op5_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op5_b:
  adc eax, ebx
op5_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op6_fn
.globl op6_b
.globl op6_e
op6_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op6_b:
  sub al, bl
op6_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op7_fn
.globl op7_b
.globl op7_e
op7_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op7_b:
  sub ax, bx
op7_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op8_fn
.globl op8_b
.globl op8_e
op8_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op8_b:
  sub eax, ebx
op8_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op9_fn
.globl op9_b
.globl op9_e
op9_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op9_b:
  sbb al, bl
op9_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op10_fn
.globl op10_b
.globl op10_e
op10_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op10_b:
  sbb ax, bx
op10_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op11_fn
.globl op11_b
.globl op11_e
op11_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op11_b:
  sbb eax, ebx
op11_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op12_fn
.globl op12_b
.globl op12_e
op12_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op12_b:
  and al, bl
op12_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op13_fn
.globl op13_b
.globl op13_e
op13_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op13_b:
  and ax, bx
op13_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op14_fn
.globl op14_b
.globl op14_e
op14_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op14_b:
  and eax, ebx
op14_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op15_fn
.globl op15_b
.globl op15_e
op15_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op15_b:
  or al, bl
op15_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op16_fn
.globl op16_b
.globl op16_e
op16_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op16_b:
  or ax, bx
op16_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op17_fn
.globl op17_b
.globl op17_e
op17_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op17_b:
  or eax, ebx
op17_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op18_fn
.globl op18_b
.globl op18_e
op18_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op18_b:
  xor al, bl
op18_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op19_fn
.globl op19_b
.globl op19_e
op19_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op19_b:
  xor ax, bx
op19_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op20_fn
.globl op20_b
.globl op20_e
op20_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op20_b:
  xor eax, ebx
op20_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op21_fn
.globl op21_b
.globl op21_e
op21_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op21_b:
  cmp al, bl
op21_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op22_fn
.globl op22_b
.globl op22_e
op22_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op22_b:
  cmp ax, bx
op22_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op23_fn
.globl op23_b
.globl op23_e
op23_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op23_b:
  cmp eax, ebx
op23_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op24_fn
.globl op24_b
.globl op24_e
op24_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op24_b:
  test al, bl
op24_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op25_fn
.globl op25_b
.globl op25_e
op25_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op25_b:
  test ax, bx
op25_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op26_fn
.globl op26_b
.globl op26_e
op26_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op26_b:
  test eax, ebx
op26_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op27_fn
.globl op27_b
.globl op27_e
op27_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op27_b:
  inc al
op27_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op28_fn
.globl op28_b
.globl op28_e
op28_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op28_b:
  inc ax
op28_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op29_fn
.globl op29_b
.globl op29_e
op29_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op29_b:
  inc eax
op29_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op30_fn
.globl op30_b
.globl op30_e
op30_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op30_b:
  dec al
op30_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op31_fn
.globl op31_b
.globl op31_e
op31_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op31_b:
  dec ax
op31_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op32_fn
.globl op32_b
.globl op32_e
op32_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op32_b:
  dec eax
op32_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op33_fn
.globl op33_b
.globl op33_e
op33_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op33_b:
  neg al
op33_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op34_fn
.globl op34_b
.globl op34_e
op34_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op34_b:
  neg ax
op34_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op35_fn
.globl op35_b
.globl op35_e
op35_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op35_b:
  neg eax
op35_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op36_fn
.globl op36_b
.globl op36_e
op36_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op36_b:
  not al
op36_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op37_fn
.globl op37_b
.globl op37_e
op37_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op37_b:
  not ax
op37_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op38_fn
.globl op38_b
.globl op38_e
op38_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op38_b:
  not eax
op38_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op39_fn
.globl op39_b
.globl op39_e
op39_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op39_b:
  shl al, cl
op39_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op40_fn
.globl op40_b
.globl op40_e
op40_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op40_b:
  shl ax, cl
op40_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op41_fn
.globl op41_b
.globl op41_e
op41_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op41_b:
  shl eax, cl
op41_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op42_fn
.globl op42_b
.globl op42_e
op42_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op42_b:
  shl eax, 1
op42_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op43_fn
.globl op43_b
.globl op43_e
op43_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op43_b:
  shr al, cl
op43_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op44_fn
.globl op44_b
.globl op44_e
op44_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op44_b:
  shr ax, cl
op44_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op45_fn
.globl op45_b
.globl op45_e
op45_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op45_b:
  shr eax, cl
op45_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op46_fn
.globl op46_b
.globl op46_e
op46_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op46_b:
  shr eax, 1
op46_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op47_fn
.globl op47_b
.globl op47_e
op47_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op47_b:
  sar al, cl
op47_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op48_fn
.globl op48_b
.globl op48_e
op48_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op48_b:
  sar ax, cl
op48_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op49_fn
.globl op49_b
.globl op49_e
op49_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op49_b:
  sar eax, cl
op49_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op50_fn
.globl op50_b
.globl op50_e
op50_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op50_b:
  sar eax, 1
op50_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op51_fn
.globl op51_b
.globl op51_e
op51_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op51_b:
  rol al, cl
op51_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op52_fn
.globl op52_b
.globl op52_e
op52_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op52_b:
  rol ax, cl
op52_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op53_fn
.globl op53_b
.globl op53_e
op53_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op53_b:
  rol eax, cl
op53_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op54_fn
.globl op54_b
.globl op54_e
op54_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op54_b:
  rol eax, 1
op54_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op55_fn
.globl op55_b
.globl op55_e
op55_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op55_b:
  ror al, cl
op55_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op56_fn
.globl op56_b
.globl op56_e
op56_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op56_b:
  ror ax, cl
op56_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op57_fn
.globl op57_b
.globl op57_e
op57_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op57_b:
  ror eax, cl
op57_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op58_fn
.globl op58_b
.globl op58_e
op58_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op58_b:
  ror eax, 1
op58_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op59_fn
.globl op59_b
.globl op59_e
op59_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op59_b:
  rcl al, cl
op59_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op60_fn
.globl op60_b
.globl op60_e
op60_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op60_b:
  rcl ax, cl
op60_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op61_fn
.globl op61_b
.globl op61_e
op61_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op61_b:
  rcl eax, cl
op61_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op62_fn
.globl op62_b
.globl op62_e
op62_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op62_b:
  rcl eax, 1
op62_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op63_fn
.globl op63_b
.globl op63_e
op63_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op63_b:
  rcr al, cl
op63_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op64_fn
.globl op64_b
.globl op64_e
op64_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op64_b:
  rcr ax, cl
op64_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op65_fn
.globl op65_b
.globl op65_e
op65_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op65_b:
  rcr eax, cl
op65_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op66_fn
.globl op66_b
.globl op66_e
op66_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op66_b:
  rcr eax, 1
op66_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op67_fn
.globl op67_b
.globl op67_e
op67_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op67_b:
  shld eax, ebx, cl
op67_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op68_fn
.globl op68_b
.globl op68_e
op68_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op68_b:
  shld ax, bx, cl
op68_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op69_fn
.globl op69_b
.globl op69_e
op69_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op69_b:
  shrd eax, ebx, cl
op69_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op70_fn
.globl op70_b
.globl op70_e
op70_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op70_b:
  shrd ax, bx, cl
op70_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op71_fn
.globl op71_b
.globl op71_e
op71_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op71_b:
  mul bl
op71_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op72_fn
.globl op72_b
.globl op72_e
op72_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op72_b:
  mul bx
op72_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op73_fn
.globl op73_b
.globl op73_e
op73_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op73_b:
  mul ebx
op73_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op74_fn
.globl op74_b
.globl op74_e
op74_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op74_b:
  imul bl
op74_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op75_fn
.globl op75_b
.globl op75_e
op75_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op75_b:
  imul bx
op75_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op76_fn
.globl op76_b
.globl op76_e
op76_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op76_b:
  imul ebx
op76_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op77_fn
.globl op77_b
.globl op77_e
op77_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op77_b:
  imul eax, ebx
op77_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op78_fn
.globl op78_b
.globl op78_e
op78_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op78_b:
  imul ax, bx
op78_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op79_fn
.globl op79_b
.globl op79_e
op79_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op79_b:
  imul eax, ebx, -7
op79_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op80_fn
.globl op80_b
.globl op80_e
op80_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op80_b:
  imul eax, ebx, 0x12345
op80_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op81_fn
.globl op81_b
.globl op81_e
op81_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op81_b:
  div bl
op81_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op82_fn
.globl op82_b
.globl op82_e
op82_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op82_b:
  div bx
op82_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op83_fn
.globl op83_b
.globl op83_e
op83_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op83_b:
  div ebx
op83_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op84_fn
.globl op84_b
.globl op84_e
op84_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op84_b:
  idiv bl
op84_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op85_fn
.globl op85_b
.globl op85_e
op85_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op85_b:
  idiv bx
op85_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op86_fn
.globl op86_b
.globl op86_e
op86_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op86_b:
  idiv ebx
op86_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op87_fn
.globl op87_b
.globl op87_e
op87_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op87_b:
  bsf eax, ebx
op87_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op88_fn
.globl op88_b
.globl op88_e
op88_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op88_b:
  bsf ax, bx
op88_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op89_fn
.globl op89_b
.globl op89_e
op89_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op89_b:
  bsr eax, ebx
op89_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op90_fn
.globl op90_b
.globl op90_e
op90_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op90_b:
  bsr ax, bx
op90_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op91_fn
.globl op91_b
.globl op91_e
op91_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op91_b:
  bt eax, ebx
op91_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op92_fn
.globl op92_b
.globl op92_e
op92_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op92_b:
  bt ax, bx
op92_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op93_fn
.globl op93_b
.globl op93_e
op93_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op93_b:
  bts eax, ebx
op93_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op94_fn
.globl op94_b
.globl op94_e
op94_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op94_b:
  bts ax, bx
op94_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op95_fn
.globl op95_b
.globl op95_e
op95_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op95_b:
  btr eax, ebx
op95_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op96_fn
.globl op96_b
.globl op96_e
op96_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op96_b:
  btr ax, bx
op96_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op97_fn
.globl op97_b
.globl op97_e
op97_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op97_b:
  btc eax, ebx
op97_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op98_fn
.globl op98_b
.globl op98_e
op98_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op98_b:
  btc ax, bx
op98_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op99_fn
.globl op99_b
.globl op99_e
op99_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op99_b:
  bswap eax
op99_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op100_fn
.globl op100_b
.globl op100_e
op100_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op100_b:
  xadd eax, ebx
op100_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op101_fn
.globl op101_b
.globl op101_e
op101_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op101_b:
  xadd al, bl
op101_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op102_fn
.globl op102_b
.globl op102_e
op102_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op102_b:
  cmpxchg ebx, ecx
op102_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op103_fn
.globl op103_b
.globl op103_e
op103_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op103_b:
  cmpxchg bl, cl
op103_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op104_fn
.globl op104_b
.globl op104_e
op104_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op104_b:
  daa
op104_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op105_fn
.globl op105_b
.globl op105_e
op105_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op105_b:
  das
op105_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op106_fn
.globl op106_b
.globl op106_e
op106_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op106_b:
  aaa
op106_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op107_fn
.globl op107_b
.globl op107_e
op107_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op107_b:
  aas
op107_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op108_fn
.globl op108_b
.globl op108_e
op108_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op108_b:
  aam
op108_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op109_fn
.globl op109_b
.globl op109_e
op109_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op109_b:
  aad
op109_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op110_fn
.globl op110_b
.globl op110_e
op110_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op110_b:
  cbw
op110_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op111_fn
.globl op111_b
.globl op111_e
op111_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op111_b:
  cwde
op111_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op112_fn
.globl op112_b
.globl op112_e
op112_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op112_b:
  cwd
op112_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op113_fn
.globl op113_b
.globl op113_e
op113_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op113_b:
  cdq
op113_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op114_fn
.globl op114_b
.globl op114_e
op114_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op114_b:
  movzx eax, bl
op114_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op115_fn
.globl op115_b
.globl op115_e
op115_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op115_b:
  movzx eax, bx
op115_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op116_fn
.globl op116_b
.globl op116_e
op116_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op116_b:
  movsx eax, bl
op116_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op117_fn
.globl op117_b
.globl op117_e
op117_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op117_b:
  movsx eax, bx
op117_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op118_fn
.globl op118_b
.globl op118_e
op118_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op118_b:
  lahf
op118_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op119_fn
.globl op119_b
.globl op119_e
op119_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op119_b:
  sahf
op119_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op120_fn
.globl op120_b
.globl op120_e
op120_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op120_b:
  cmc
op120_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op121_fn
.globl op121_b
.globl op121_e
op121_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op121_b:
  xchg eax, ebx
op121_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op122_fn
.globl op122_b
.globl op122_e
op122_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op122_b:
  lea eax, [ebx+ecx*4+0x1234]
op122_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op123_fn
.globl op123_b
.globl op123_e
op123_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op123_b:
  lea ax, [ebx+ecx*2-5]
op123_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op124_fn
.globl op124_b
.globl op124_e
op124_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op124_b:
  seto al
op124_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op125_fn
.globl op125_b
.globl op125_e
op125_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op125_b:
  setno al
op125_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op126_fn
.globl op126_b
.globl op126_e
op126_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op126_b:
  setb al
op126_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op127_fn
.globl op127_b
.globl op127_e
op127_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op127_b:
  setae al
op127_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op128_fn
.globl op128_b
.globl op128_e
op128_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op128_b:
  sete al
op128_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op129_fn
.globl op129_b
.globl op129_e
op129_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op129_b:
  setne al
op129_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op130_fn
.globl op130_b
.globl op130_e
op130_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op130_b:
  setbe al
op130_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op131_fn
.globl op131_b
.globl op131_e
op131_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op131_b:
  seta al
op131_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op132_fn
.globl op132_b
.globl op132_e
op132_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op132_b:
  sets al
op132_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op133_fn
.globl op133_b
.globl op133_e
op133_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op133_b:
  setns al
op133_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op134_fn
.globl op134_b
.globl op134_e
op134_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op134_b:
  setp al
op134_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op135_fn
.globl op135_b
.globl op135_e
op135_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op135_b:
  setnp al
op135_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op136_fn
.globl op136_b
.globl op136_e
op136_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op136_b:
  setl al
op136_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op137_fn
.globl op137_b
.globl op137_e
op137_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op137_b:
  setge al
op137_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op138_fn
.globl op138_b
.globl op138_e
op138_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op138_b:
  setle al
op138_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.globl op139_fn
.globl op139_b
.globl op139_e
op139_fn:
  push ebx
  push esi
  push edi
  push ebp
  mov ebp, [esp+20]
  mov eax, [ebp]
  mov ebx, [ebp+4]
  mov ecx, [ebp+8]
  mov edx, [ebp+12]
  push dword ptr [ebp+16]
  popfd
op139_b:
  setg al
op139_e:
  pushfd
  pop dword ptr [ebp+16]
  mov [ebp], eax
  mov [ebp+4], ebx
  mov [ebp+8], ecx
  mov [ebp+12], edx
  pop ebp
  pop edi
  pop esi
  pop ebx
  ret
.section .note.GNU-stack,"",@progbits
