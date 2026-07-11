package org.spacehub;

import org.mockito.Mockito;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.mail.javamail.JavaMailSender;

import javax.sql.DataSource;

@TestConfiguration
public class TestSecurityConfig {

  @Bean
  public JavaMailSender javaMailSender() {
    return Mockito.mock(JavaMailSender.class);
  }

  @Bean
  public DataSource dataSource() {
    return new EmbeddedDatabaseBuilder()
      .setType(EmbeddedDatabaseType.H2)
      .build();
  }
}

