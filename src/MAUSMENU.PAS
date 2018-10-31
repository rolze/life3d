UNIT MAUSMENU;

Interface

Type GCursor=Record
       screenMaske,cursorMaske: Array[0..15] Of Word;
       xhot,yhot: Integer;
     End;

Const Hand:GCursor=
           (screenMaske:($E1FF,$E1FF,$E1FF,$E1FF,
                         $E1FF,$E000,$E000,$E000,
                         $0000,$0000,$0000,$0000,
                         $0000,$0000,$0000,$0000);
            cursorMaske:($1E00,$1200,$1200,$1200,
                         $1200,$13FF,$1249,$1249,
                         $F249,$9049,$9001,$8001,
                         $8001,$8001,$8001,$FFFF);
            xHot:5; yHot:0);
      Kreuz:Gcursor=
            (screenMaske:($FEFF,$FEFF,$FEFF,$FEFF,
                          $FEFF,$FEFF,$FEFF,$0001,
                          $FEFF,$FEFF,$FEFF,$FEFF,
                          $FEFF,$FEFF,$FEFF,$FEFF);
             cursorMaske:($0100,$0100,$0100,$0100,
                          $0100,$0100,$0100,$FFFE,
                          $0100,$0100,$0100,$0100,
                          $0100,$0100,$0100,$0100);
             xHot:7; yHot:7);

Const linkeTaste=1;
      rechteTaste=2;
      beideTasten=3;
      keineTaste=0;

Type Maus=Object
       Procedure Init;
       Procedure Reset;
       Function GetX:Integer;
       Function GetY:Integer;
       Function GetTaste:Integer;
       Procedure Status(Var xpos,ypos,t:Integer);
       Procedure SetXY(xpos,ypos:Integer);
       Procedure Show(ch:Boolean);
       Procedure MWindow(x1,y1,x2,y2:Integer);
       Function Innen(x1,y1,x2,y2,xpos,ypos:Integer):Boolean;
       Function Aussen(x1,y1,x2,y2,xpos,ypos:Integer):Boolean;
       Procedure SetKreuz;
       Procedure SetHand;
     End;
     Menu=Object(Maus)
       Procedure Win(x1,y1,x2,y2:Integer;c1,c2,c3:Byte);
       Procedure Rand(x1,y1,x2,y2,c1,c2:Integer);
       Procedure ButtonOut(x1,y1,x2,y2:Integer;st:String);
       Procedure ButtonIn(x1,y1,x2,y2:Integer;st:String);
       Procedure GetButton(x1,y1,x2,y2,mk,xpos,ypos,taste:Integer;st:String;var chk:Boolean);
       Procedure GetSwitch(x1,y1,x2,y2,mk,xpos,ypos,taste:Integer;st1,st2:String;var chk1,chk2:Boolean);
       Procedure Window(x1,y1,x2,y2:Integer;st:Array of String; Var ov:Byte);
     End;

Var sichtbar,KreuzChk,HandChk: Boolean;

Implementation

Uses CRT,GRAPH,DOS,FASTTEXT;

Var reg: Registers;
    mx,my,mt: Integer;
    p: Pointer;
    size: Word;

{-----Maus initialisieren-----}
Procedure Maus.Reset;
Begin
  If Mem[MemW[0:$cc+2]:MemW[0:$cc]]=$cf Then Begin
    writeln('Maus oder Maustreiber nicht gefunden!');
    Halt;
  End;
End;
{-----Mausstatus (Position, Tasten) abfragen-----}
Procedure Maus.status(Var xpos,ypos,t:Integer);
Begin
  reg.ax:=3;
  Intr(51,reg);
  t:=reg.bx;
  xpos:=reg.cx;
  ypos:=reg.dx;
End;
{-----X-Koordinate der Mausposition einlesen-----}
Function Maus.GetX:Integer;
Begin
  reg.ax:=3;
  Intr(51,reg);
  GetX:=reg.cx;
End;
{-----Y-Koordinate der Mausposition einlesen-----}
Function Maus.GetY:Integer;
Begin
  reg.ax:=3;
  Intr(51,reg);
  GetY:=reg.dx;
End;
{-----Maustaste einlesen-----}
Function Maus.GetTaste:Integer;
Begin
  reg.ax:=3;
  Intr(51,reg);
  GetTaste:=reg.bx;
End;
{-----Mauszeiger an bestimmte Stelle setzen-----}
Procedure Maus.SetXY(xpos,ypos:Integer);
Begin
  reg.ax:=4;
  reg.cx:=xpos;
  reg.dx:=ypos;
  Intr(51,reg);
End;
{-----Mauszeiger ein/ausschalten-----}
Procedure Maus.Show(ch:Boolean);
Begin
  If ch And Not sichtbar Then Begin
    reg.ax:=1;
    sichtbar:=True;
    Intr(51,reg);
  End;
  If Not ch And sichtbar Then Begin
    reg.ax:=2;
    sichtbar:=False;
    Intr(51,reg);
  End;
End;
{-----Funktion zur Ermittlung der kleineren Variable-----}
Function min(a,b:Integer):Integer;
Begin
 If a<b Then min:=a
        Else min:=b;
End;
{-----Funktion zur Ermittlung der gr”áeren Variable-----}
Function max(a,b:Integer):Integer;
Begin
  If a>b Then max:=a
         Else max:=b;
End;
{-----Werte der Variablen tauschen-----}
Procedure SwapXY(Var a,b:Integer);
Var h: Integer;
Begin
  h:=a;
  a:=b;
  b:=h;
End;
{-----Mausfenster setzen-----}
Procedure Maus.MWindow(x1,y1,x2,y2:Integer);
Begin
  reg.ax:=7;
  reg.cx:=min(x1,x2);
  reg.dx:=max(x1,x2);
  Intr(51,reg);
  reg.ax:=8;
  reg.cx:=min(y1,y2);
  reg.dx:=max(y1,y2);
  Intr(51,reg);
End;
{-----Abfrage, ob Maus sich innerhalb eines best. Bereichs befindet-----}
Function Maus.Innen(x1,y1,x2,y2:Integer;xpos,ypos:Integer):Boolean;
Begin
  If x1>x2 Then SwapXY(x1,x2);
  If y1>y2 Then SwapXY(y1,y2);
  If (xpos>=x1) And (xpos<=x2) And (ypos>=y1) And (ypos<=y2) Then
    Innen:=True
  Else
    Innen:=False;
End;
{-----Abfrage, ob Maus sich auáerhalb eines best. Bereichs befindet-----}
Function Maus.Aussen(x1,y1,x2,y2:Integer;xpos,ypos:Integer):Boolean;
Begin
  If x1>x2 Then SwapXY(x1,x2);
  If y1>y2 Then SwapXY(y1,y2);
  If (xpos<x1) Or (xpos>x2) Or (ypos<y1) Or (ypos>y2) Then
    aussen:=True
  Else
    aussen:=False;
End;
{-----Hand-Mauszeiger setzen-----}
Procedure Maus.SetHand;
Begin
  If KreuzChk And (HandChk=False) Then Begin
    reg.ax:=9;
    reg.bx:=hand.xhot;
    reg.cx:=hand.yhot;
    reg.dx:=ofs(hand.screenMaske);
    reg.es:=seg(hand.screenMaske);
    Intr(51,reg);
    KreuzChk:=False;
    HandChk:=True;
  End;
End;
{-----Kreuz-Mauszeiger setzen-----}
Procedure Maus.SetKreuz;
Begin
  If HandChk And (KreuzChk=False) Then Begin
    reg.ax:=9;
    reg.bx:=kreuz.xhot;
    reg.cx:=kreuz.yhot;
    reg.dx:=ofs(kreuz.screenMaske);
    reg.es:=seg(kreuz.screenMaske);
    Intr(51,reg);
    HandChk:=False;
    KreuzChk:=True;
  End;
End;
{-----Mausfenster und Mauszeiger setzen-----}
Procedure Maus.Init;
Begin
  MWindow(0,0,getmaxX,getmaxY);
  SetHand;
  SetXY(GetMaxX div 2,GetMaxY div 2);
End;
{-----Fenster mit Kanten zeichnen-----}
Procedure Menu.Win(x1,y1,x2,y2:Integer;c1,c2,c3:Byte);
Begin
  If x1>x2 Then SwapXY(x1,x2);
  If y1>y2 Then SwapXY(y1,y2);
  SetFillStyle(1,c2);
  SolidBar(x1,y1,x2,y2);
  SetColor(c1);
  Line(x1,y1,x2,y1);
  Line(x1+1,y1+1,x2-1,y1+1);
  Line(x1,y1,x1,y2);
  Line(x1+1,y1+1,x1+1,y2-1);
  SetColor(c3);
  Line(x2,y1,x2,y2);
  Line(x2-1,y1+1,x2-1,y2-1);
  Line(x1,y2,x2,y2);
  Line(x1+1,y2-1,x2-1,y2-1);
End;
{-----Rahmen zeichnen-----}
Procedure Rahmen(x1,y1,x2,y2:Integer);
Begin
  SetColor(15);
  Line(x1,y1,x2,y1);
  Line(x1+1,y1+1,x2-1,y1+1);
  Line(x1,y1,x1,y2);
  Line(x1+1,y1+1,x1+1,y2-1);
  Line(x2-3,y1+3,x2-3,y2-3);
  Line(x2-4,y1+4,x2-4,y2-4);
  Line(x1+3,y2-3,x2-3,y2-3);
  Line(x1+4,y2-4,x2-4,y2-4);
  SetColor(13);
  Line(x2,y1,x2,y2);
  Line(x2-1,y1+1,x2-1,y2-1);
  Line(x1,y2,x2,y2);
  Line(x1+1,y2-1,x2-1,y2-1);
  Line(x1+3,y1+3,x2-3,y1+3);
  Line(x1+4,y1+4,x2-4,y1+4);
  Line(x1+3,y1+3,x1+3,y2-3);
  Line(x1+4,y1+4,x1+4,y2-4);
End;
{-----Bildschirmausschnitt speichern-----}
Procedure GetWin(x1,y1,x2,y2:Integer);
Begin
 size:=imagesize(x1,y1,x2,y2);
 getmem(p,size);
 getimage(x1,y1,x2,y2,p^);
End;
{-----Gespeicherten Bildschirmausschnitt setzen-----}
Procedure SetWin(x1,y1:Integer);
Begin
  PutImage(x1,y1,p^,0);
  FreeMem(p,size);
End;
{-----Schaltfl„che darstellen-----}
Procedure Menu.ButtonOut(x1,y1,x2,y2:Integer;st:String);
Var tx,ty: Integer;
Begin
  Setfillstyle(1,14);
  SolidBar(x1,y1,x2,y2);
  SetColor(15);
  Line(x1,y1,x2,y1);
  Line(x1,y1,x1,y2);
  SetColor(13);
  Line(x2,y1,x2,y2);
  Line(x1,y2,x2,y2);
  tx:=x1+(x2-x1-TextWidth(st)) div 2;
  ty:=y1+(y2-y1-TextHeight(st)) div 2;
  SetColor(0);
  ShowTextXY(tx+1,ty+1,st);
  SetColor(15);
  ShowTextXY(tx,ty,st);
End;
{-----Gedrckte Schaltfl„che darstellen-----}
Procedure Menu.ButtonIn(x1,y1,x2,y2:Integer;st:String);
var tx,ty:Integer;
Begin
  SetFillStyle(1,14);
  SolidBar(x1,y1,x2,y2);
  SetColor(13);
  Line(x1,y1,x2,y1);
  Line(x1,y1,x1,y2);
  SetColor(15);
  Line(x2,y1,x2,y2);
  Line(x1,y2,x2,y2);
  tx:=x1+(x2-x1-TextWidth(st)) div 2;
  ty:=y1+(y2-y1-TextHeight(st)) div 2;
  SetColor(15);
  ShowTextXY(tx+2,ty+2,st);
  SetColor(0);
  ShowTextXY(tx+1,ty+1,st);
End;
{-----Rahmen des Menfensters zeichnen-----}
Procedure Menu.Rand(x1,y1,x2,y2,c1,c2:Integer);
Begin
  SetColor(c1);
  Line(x1,y1,x2,y1);
  Line(x1+1,y1+1,x2-1,y1+1);
  Line(x1,y1,x1,y2);
  Line(x1+1,y1+1,x1+1,y2-1);
  SetColor(c2);
  Line(x2,y1,x2,y2);
  Line(x2-1,y1+1,x2-1,y2-1);
  Line(x1,y2,x2,y2);
  Line(x1+1,y2-1,x2-1,y2-1);
End;
{-----Mausabfrage, ob Schaltfl„che (Knopf) gedrckt wird-----}
Procedure Menu.GetSwitch(x1,y1,x2,y2,mk,xpos,ypos,taste:Integer;st1,st2:String;var chk1,chk2:Boolean);
Var x,y,t: Integer;
Begin
  If (taste=mk) And Innen(x1,y1,x2,y2,xpos,ypos) Then Begin
    Show(False);
    chk1:=Not Chk1;
    If Chk1 Then ButtonIn(x1+1,y1+1,x2-1,y2-1,st1);
    If (Chk1=False) Then ButtonOut(x1+1,y1+1,x2-1,y2-1,st2);
    chk2:=True;
    Show(True);
    Repeat
      Status(mx,my,mt);
    Until mt=keinetaste;
  End;
End;
{-----Mausabfrage, ob Schaltfl„che (Schalter) gedrckt wird-----}
Procedure Menu.GetButton(x1,y1,x2,y2,mk,xpos,ypos,taste:Integer;st:String;var chk:Boolean);
Var x,y,t: Integer;
Begin
  If (taste=mk) And Innen(x1,y1,x2,y2,xpos,ypos) Then Begin
    Show(False);
    ButtonIn(x1,y1,x2,y2,st);
    Show(True);
    Repeat
      Status(x,y,t);
    Until (t=keinetaste) or aussen(x1,y1,x2,y2,x,y);
    Show(False);
    ButtonOut(x1,y1,x2,y2,st);
    Show(True);
    If Innen(x1,y1,x2,y2,x,y) Then chk:=True
                              Else chk:=False;
  End;
End;
{-----Menfenster mit Liste von Befehlen darstellen-----}
Procedure Menu.Window(x1,y1,x2,y2:Integer;st:Array of String;Var ov:Byte);
Var stranzahl,th,tb: Byte;
    i: Integer;
    b: Array[0..10] Of Boolean;
    Ende: Boolean;
Begin
  Ende:=False;
  For i:= 0 To 10 Do
    b[i]:=False;
    If x1>x2 Then SwapXY(x1,x2);
    If y1>y2 Then SwapXY(y1,y2);
    stranzahl:=sizeof(st) div sizeof(String);
    Show(False);
    GetWin(x1,y1,x2,y2);
    SetFillStyle(1,14);
    SetColor(14);
    SolidBar(x1,y1,x2,y2);
    Rahmen(x1,y1,x2,y2);
    For i:=0 To stranzahl-1 Do
    ButtonOut(x1+6,y1+6+i*20,x2-7,y1+23+i*20,st[i]);
    Show(True);
    Repeat
      Status(mx,my,mt);
      For i:= 0 To stranzahl-1 Do Begin
      If (mt<>0) And Aussen(x1,y1,x2,y2,mx,my) Then Ende:=True;
      Getbutton(x1+6,y1+6+i*20,x2-7,y1+23+i*20,linketaste,mx,my,mt,st[i],b[i]);
    End;
    For i:= 0 To stranzahl-1 Do
      If b[i] Then Begin
        ov:=i+1;
        Ende:=True;
      End;
  Until Ende=True;
  Show(False);
  SetWin(x1,y1);
  Show(True);
End;

Begin
 sichtbar:=False;
 HandChk:=False;
 KreuzChk:=True;
End.