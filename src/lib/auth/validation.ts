export type SignupFieldErrors = Partial<
  Record<
    | "username"
    | "email"
    | "password"
    | "address"
    | "phoneNumber"
    | "name"
    | "gender"
    | "tangoRole"
    | "hints",
    string
  >
>;

export type SignupInput = {
  username: string;
  email: string;
  password: string;
  address: string;
  phoneNumber: string;
  name: string;
  gender: string;
  tangoRole: string;
  hints: { question: string; answer: string }[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function validateSignup(input: SignupInput): SignupFieldErrors {
  const errors: SignupFieldErrors = {};

  if (!USERNAME_RE.test(input.username)) {
    errors.username = "아이디는 영문, 숫자, _ 로 3~20자여야 합니다.";
  }
  if (!EMAIL_RE.test(input.email)) {
    errors.email = "올바른 이메일 주소를 입력해주세요.";
  }
  if (input.password.length < 8) {
    errors.password = "비밀번호는 8자 이상이어야 합니다.";
  }
  if (!input.address.trim()) {
    errors.address = "주소를 입력해주세요.";
  }
  if (!input.phoneNumber.trim()) {
    errors.phoneNumber = "휴대폰번호를 입력해주세요.";
  }
  if (!input.name.trim()) {
    errors.name = "이름을 입력해주세요.";
  }
  if (!["male", "female", "other"].includes(input.gender)) {
    errors.gender = "성별을 선택해주세요.";
  }
  if (!["leader", "follower"].includes(input.tangoRole)) {
    errors.tangoRole = "리더/팔로워를 선택해주세요.";
  }
  if (
    input.hints.length !== 3 ||
    input.hints.some((h) => !h.question.trim() || !h.answer.trim())
  ) {
    errors.hints = "보안 질문 3개와 답변을 모두 입력해주세요.";
  }

  return errors;
}

export function validateLogin(identifier: string, password: string) {
  const errors: Partial<Record<"identifier" | "password", string>> = {};
  if (!identifier.trim()) {
    errors.identifier = "아이디 또는 이메일을 입력해주세요.";
  }
  if (!password) {
    errors.password = "비밀번호를 입력해주세요.";
  }
  return errors;
}
