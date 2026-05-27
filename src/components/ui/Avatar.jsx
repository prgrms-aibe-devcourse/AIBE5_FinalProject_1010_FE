/**
 * @file Avatar.jsx
 * @description 선생님/학생 프로필 원형 아바타 공통 컴포넌트입니다.
 * - size: sm, md, lg, xl CSS 클래스와 연결됩니다.
 * - color: c1~c6 CSS 클래스와 연결됩니다.
 * - children에는 보통 이름의 첫 글자를 넣습니다.
 */
/**
 * 아바타 컴포넌트. 색상(c1~c6)과 크기(sm/md/lg/xl)를 prop으로 지정.
 * 사용: <Avatar size="sm" color="c1">박</Avatar>
 */
export default function Avatar({ size = 'md', color = 'c1', children, style }) {
  return (
    <div className={`avatar ${size} ${color}`} style={style}>{children}</div>
  )
}
