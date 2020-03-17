import styled from 'styled-components';

export const Wrapper = styled.div`
  position: fixed;
  bottom: 0;
  top: 0;
  z-index: 43;
  background: #fff;
  padding: 12px;
  display: flex;
  flex-direction: column;
`;

export const Label = styled.label`
  position: absolute;
  background: #fff;
  top: 0px;
  padding: 0px 6px;
  margin-left: 10px;
`;
export const FormWrapper = styled.div`
  position: relative;
  margin: 4px 0;
  padding: 8px 0;
`;
export const Button = styled.button`
  font-size: 18px;
  font-weight: 600;
`;

export const InfoText = styled.div`
  color: rgb(168, 168, 184);
  font-size: 10px;
  font-weight: 500;
`;
export const CarInfo = styled.div`
  border-radius: 4px;
  border: 1px solid rgb(25, 25, 36);
  div {
    padding: 8px;
  }
`;
export const Heading = styled.div`
  background-color: #00afba;
  color: #fff;
  font-weight: 500;
`;
export const ActiveCarWrapper = styled.div`
  margin-top: 12px;
`;
