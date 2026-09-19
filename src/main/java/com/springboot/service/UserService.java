package com.springboot.service;

import com.springboot.dto.LoginDto;
import com.springboot.dto.MemberDto;
import com.springboot.dto.RegisterDto;
import com.springboot.exception.ApplicationException;
import com.springboot.model.User;
import com.springboot.repository.UserRepository;
import com.springboot.util.JwtUtil;
import com.springboot.util.PasswordUtil;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;

    private final JwtUtil jwtUtil;

    private final PasswordUtil passwordUtil;

    public UserService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordUtil = PasswordUtil.getInstance();
        this.jwtUtil = jwtUtil;
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(
                        () -> new ApplicationException("ไม่พบผู้ใช้งานด้วยอีเมลนี้: " + email, HttpStatus.NOT_FOUND));
    }

    public User authenticate(String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        String idStr = jwtUtil.extractUserId(token);

        if (!jwtUtil.validateToken(token, idStr)) {
            throw new ApplicationException("Token ไม่ถูกต้องหรือหมดอายุ", HttpStatus.UNAUTHORIZED);
        }

        Integer userId = Integer.parseInt(idStr);
        return userRepository.findById(userId)
                .orElseThrow(
                        () -> new ApplicationException("ไม่พบสิทธิ์และข้อมูลบัญชีผู้ใช้ในระบบ", HttpStatus.NOT_FOUND));
    }

    public void registerUser(RegisterDto request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ApplicationException("ข้อมูลผู้ใช้ซ้ำ กรุณาลองใหม่อีกครั้ง", HttpStatus.CONFLICT);
        }

        try {
            String hashedPassword = passwordUtil.createPassword(request.getPassword(), request.getEmail());

            User user = new User();
            user.setFirstName(request.getFirstName());
            user.setLastName(request.getLastName());
            user.setEmail(request.getEmail());
            user.setPhoneNumber(request.getPhoneNumber());
            user.setPassword(hashedPassword);

            userRepository.save(user);
        } catch (Exception e) {
            throw new ApplicationException("เกิดข้อผิดพลาดภายในระบบ ไม่สามารถสมัครสมาชิกได้: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public boolean login(LoginDto loginDto) {
        try {
            String hashedPassword = passwordUtil.createPassword(loginDto.getPassword(), loginDto.getEmail());
            return userRepository.findByEmailAndPassword(loginDto.getEmail(), hashedPassword).isPresent();
        } catch (Exception e) {
            throw new ApplicationException("เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public MemberDto getMemberProfile(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApplicationException("ไม่พบข้อมูลรายละเอียดสมาชิก", HttpStatus.NOT_FOUND));

        return new MemberDto(
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getPhoneNumber());
    }

    public void updateMemberProfile(String email, MemberDto updatedProfile) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApplicationException("ไม่พบข้อมูล", HttpStatus.NOT_FOUND));

        try {
            user.setFirstName(updatedProfile.getFirstName());
            user.setLastName(updatedProfile.getLastName());
            user.setPhoneNumber(updatedProfile.getPhoneNumber());
            userRepository.save(user);
        } catch (Exception e) {
            throw new ApplicationException("ไม่สามารถแก้ไขข้อมูลได้ กรุณาลองใหม่อีกครั้ง" + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public Long getUserStats() {
        return userRepository.countNonAdminUsers();
    }

}
