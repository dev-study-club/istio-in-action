import wasmUrl from '@rive-app/canvas-lite/rive.wasm?url';
import fallbackWasmUrl from '@rive-app/canvas-lite/rive_fallback.wasm?url';
import {
  Alignment,
  Fit,
  Layout,
  RuntimeLoader,
  type StateMachineInput,
  useRive,
} from '@rive-app/react-canvas-lite';
import { useEffect, useMemo } from 'react';

import { riveStage } from './RiveScene.css';

// 런타임 기본값은 unpkg CDN이다. 번들에 함께 나가는 사본을 쓰게 해 외부 의존을 끊는다
RuntimeLoader.setWasmUrl(wasmUrl);
RuntimeLoader.setWasmFallbackUrl(fallbackWasmUrl);

// 캔버스가 화면 전체라 비율이 안 맞는다 — 잘라내는 대신 짧은 변에 맞춰 전부 보여준다
const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center });

/** 상태 머신 입력 이름 → 값 */
type RiveInputValues = Readonly<Record<string, number | boolean>>;

interface RiveSceneProps {
  /** public/rive/<name>.riv */
  name: string;
  /** 상태 머신 이름 — 이 축하 연출 파일들은 전부 상태 머신으로 만들어져 있다 */
  stateMachine: string;
  /** 트리거를 당기기 전에 채워둘 입력값. 렌더마다 새로 만들면 연출이 다시 시작되니 상수로 넘긴다 */
  values?: RiveInputValues;
  /** 재생을 시작시키는 트리거. 당기지 않으면 정지 화면만 남는다 */
  trigger: string;
}

/**
 * 축하 연출용 Rive 렌더러.
 *
 * 전부 장식이라 aria-hidden이고, 실패해도 조용히 아무것도 그리지 않는다.
 * "지금 띄울지"와 "언제 걷을지"는 부르는 쪽이 정한다 — 상태 머신은 끝나는 시점이 없어서
 * 이쪽에서 알려줄 수 있는 게 없다 (CelebrationOverlay 주석 참고).
 *
 * 이 파일을 정적으로 import하면 Rive 런타임이 진도 화면 청크에 실린다 —
 * 축하할 일이 없어도 매번 받게 되므로 부르는 쪽에서 lazy로 가져간다.
 */
export function RiveScene({ name, stateMachine, values, trigger }: RiveSceneProps) {
  /* 렌더마다 새 객체를 넘기면 훅이 인스턴스를 계속 만들었다 버려 로딩이 끝나지 않는다 —
     캔버스가 0x0에 머물러 아무것도 그려지지 않는다 */
  const riveParams = useMemo(
    () => ({
      src: `${import.meta.env.BASE_URL}rive/${name}.riv`,
      stateMachines: stateMachine,
      autoplay: true,
      layout: LAYOUT,
      // 장식이라 클릭·호버를 가로챌 이유가 없다
      shouldDisableRiveListeners: true,
    }),
    [name, stateMachine],
  );
  const { RiveComponent, rive } = useRive(riveParams);

  useEffect(() => {
    // 입력은 로드 전에 잡을 수 없다 — 인스턴스가 준비된 뒤 채우고 당긴다
    if (!rive) return;
    start(rive.stateMachineInputs(stateMachine), values, trigger);
  }, [rive, stateMachine, values, trigger]);

  return <RiveComponent className={riveStage} aria-hidden />;
}

/** 입력을 먼저 채우고 트리거를 당긴다 — 순서가 뒤집히면 이전 값으로 재생된다 */
function start(
  inputs: readonly StateMachineInput[],
  values: RiveInputValues | undefined,
  trigger: string,
): void {
  for (const input of inputs) {
    const value = values?.[input.name];
    if (value !== undefined) input.value = value;
  }
  inputs.find(({ name }) => name === trigger)?.fire();
}
