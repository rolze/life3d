UNIT FASTTEXT;

Interface

Procedure ShowText(str:String);
Procedure ShowTextXY(x,y:Integer;str:String);
Procedure SolidBar(x1,y1,x2,y2:Integer);
procedure InitFast;
procedure GetCharacters;
procedure SetCharMem(Var ch);
procedure SetVga;
procedure ResetVga;
procedure SetHotColor(c:Integer);
function  GetHotColor:Integer;

Implementation

Uses GRAPH,DOS;

Var keyfarbe: Byte;
    chars: Pointer;

{-----Buchstaben einlesen-----}
Procedure GetCharacters;
Var i: Integer;
Begin
  Setcolor(1);
  SetFillStyle(solidfill,black);
  SetPalette(1,black);
  i:=0;
  While i<>2048 Do Begin
    MoveTo(0,0);
    OutText(chr(i div 8));
    Asm
      push ds
      lds si,chars
      mov ax,$a000
      mov es,ax
      add si,I
      mov di,0
      mov ax,es:[di]
      mov [si],ax
      add di,80
      inc si
      mov ax,es:[di]
      mov [si],ax
      add di,80
      inc si
      mov ax,es:[di]
      mov [si],ax
      add di,80
      inc si
      mov ax,es:[di]
      mov [si],ax
      add di,80
      inc si
      mov ax,es:[di]
      mov [si],ax
      add di,80
      inc si
      mov ax,es:[di]
      mov [si],ax
      add di,80
      inc si
      mov ax,es:[di]
      mov [si],ax
      add di,80
      inc si
      mov ax,es:[di]
      mov [si],ax
      add di,80
      inc si
      pop ds
    end;
    Inc(i,8);
    Bar(0,0,8,8);
  End;
  SetPalette(1,1);
  SetFillStyle(solidfill,white);
End;
Procedure SetCharMem(Var ch);
Begin
  chars:=addr(ch);
End;
{-----Initialisierung-----}
Procedure InitFast;
Begin
  Getcharacters;
  ResetVga;
  SetHotColor(red);
End;
{-----VGA-Modus initialisieren-----}
Procedure SetVga;
Var r: Registers;
Begin
  r.ah:=0;
  r.al:=$12;
  Intr($10,r);
End;
Procedure ResetVga;
Begin
  Asm
    mov dx,$3ce
    mov ax,$ff08
    out dx,ax
    mov ax,$0005
    out dx,ax
    mov ax,$0003
    out dx,ax
    mov ax,$0000
    out dx,ax
    mov ax,$0001
    out dx,ax;
  End;
End;
{-----Farbe fÅr HotKey vergeben-----}
Procedure Sethotcolor(c:Integer);
Begin
  keyfarbe:=c;
End;
{-----Farbe des HotKey einlesen-----}
Function Gethotcolor:Integer;
Begin
  GetHotColor:=keyfarbe;
End;
{-----Prozedur fÅr schneller Textausgabe im Grafikmodus-----}
Procedure Showtext(str:String);
Const hoehe=8;
Var limits: ViewPortType;
    farbe: Byte;
    x,y: Integer;
Begin
  If length(str)<>0 Then Begin
    GetViewSettings(limits);
    farbe:=getcolor;
    x:=getx;
    y:=gety;
    MoveTo(x+length(str)*8,y);
    Asm
      mov dx,$3ce
      mov ax,$0005
      out dx,ax
      mov al,$03
      out dx,ax
      mov ax,$0f01
      out dx,ax
      xor al,al
      mov ah,farbe
      out dx,ax
      lea di,Str
      mov dl,ss:[di]
      mov ah,$a0
      mov es,ax
      mov ax,y
      add ax,limits.y1
      cmp ax,480
      jae @ende
      mov bx,ax
      mov cl,6
      shl bx,cl
      mov cl,4
      shl ax,cl
      add bx,ax
      mov ax,x
      add ax,limits.x1
      cmp ax,640
      jae @ende
      mov cl,al
      shr ax,1
      shr ax,1
      shr ax,1
      add bx,ax
      inc di
      @nextchar:
      mov al,ss:[di]
      cmp al,'{'
      jne @nextzeichen
      dec dl
      push dx
      mov dx,$3ce
      xor al,al
      mov ah,keyfarbe
      out dx,ax
      pop dx
      inc di
      mov al,ss:[di]
      @nextzeichen:
      xor ah,ah
      shl ax,1
      shl ax,1
      shl ax,1
      push dx
      push bx
      push di
      push ds
      lds si,Chars
      add si,ax
      and cl,7
      mov dx,$3ce
      mov ch,hoehe
      @nextbyte:
      mov di,cx
      mov ah,[si]
      xor al,al
      shr ax,cl
      mov ch,al
      mov al,08
      out dx,ax
      mov ah,es:[bx]
      mov es:[bx],ah
      mov ah,ch
      out dx,ax
      inc bx
      mov ah,es:[bx]
      mov es:[bx],ah
      add bx,79
      inc si
      mov cx,di
      dec ch
      jnz @nextbyte
      pop ds
      pop di
      pop bx
      inc bx
      inc di
      segss mov al,[di]
      cmp al,'}'
      jne @nochhot
      xor al,al
      mov ah,farbe
      out dx,ax
      inc di
      pop dx
      dec dl
      push dx
      @nochhot:
      pop dx
      dec dl
      jnz @nextchar
      @ende:
      mov dx,$3ce
      mov ax,$0001
      out dx,ax
      xor al,al
      out dx,ax
    End;
  End;
End;
{-----Textausgabe an bestimmter Position-----}
Procedure ShowTextXY(x,y:Integer;str:String);
Begin
  MoveTo(x,y);
  ShowText(str);
End;
{-----Verbesserte Prozedur fÅr Ausgabe eines gefÅllten Rechtecks am Bildschirm-----}
Procedure SolidBar(x1,y1,x2,y2:Integer);
Var startmask,endmask: Byte;
    filler: FillSettingsType;
    limits: ViewPortType;
Begin
  GetViewSettings(limits);
  GetFillSettings(filler);
  Asm
    mov ax,x2
    cmp ax,x1
    jae @xok
    mov dx,x1
    mov x1,ax
    mov x2,dx
    @xok:
    mov ax,y2
    cmp ax,y1
    jae @yok
    mov dx,y1
    mov y1,ax
    mov y2,dx
    @yok:
    mov ax,y1
    add ax,limits.y1
    cmp ax,480
    jae @ende
    mov di,ax
    mov cl,6
    shl di,cl
    mov cl,4
    shl ax,cl
    add di,ax
    mov ax,x1
    add ax,limits.x1
    cmp ax,640
    jae @ende
    mov cl,al
    shr ax,1
    shr ax,1
    shr ax,1
    add di,ax
    and cl,7
    mov al,$ff
    shr al,cl
    mov startmask,al
    mov cx,x2
    add cx,limits.x1
    and cl,7
    xor cl,7
    mov al,$ff
    shl al,cl
    mov endmask,al
    mov dx,$3ce
    mov ax,$0005
    out dx,ax
    mov ax,$0003
    out dx,ax
    xor al,al
    mov ah,byte(filler.color)
    out dx,ax
    mov ax,$0f01
    out dx,ax
    push ds
    mov ax,$a000
    mov es,ax
    mov ds,ax
    mov cx,x2
    add cx,limits.x1
    shr cx,1
    shr cx,1
    shr cx,1
    mov ax,x1
    add ax,limits.x1
    shr ax,1
    shr ax,1
    shr ax,1
    sub cx,ax
    dec cx
    mov bx,y2
    sub bx,y1
    inc bx
    mov al,$08
    mov ah,startmask
    out dx,ax
    push di
    push bx
    mov si,$50
    @first:
    mov ah,[di]
    mov [di],ah
    add di,si
    dec bx
    jnz @first
    pop bx
    pop di
    inc di
    cmp cx,81
    jae @breite0
    push di
    push bx
    add di,cx
    mov ah,endmask
    out dx,ax
    @last:
    mov ah,[di]
    mov [di],ah
    add di,si
    dec bx
    jnz @last
    pop bx
    pop di
    mov ah,$ff
    out dx,ax
    mov ds,cx
    sub si,cx
    cld
    @zeile:
    rep stosb
    add di,si
    mov cx,ds
    dec bx
    jnz @zeile
    @breite0:
    pop ds
    @ende:
    mov ax,$a001
    out dx,ax
    xor al,al
    mov ah,0
    out dx,ax
  End;
End;

END.